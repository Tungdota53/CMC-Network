import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma, MaterialStatus } from '@campus-connect/database';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { PDFParse } from 'pdf-parse';

type Flashcard = { front: string; back: string };
type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
};
type AiMaterialContent = {
  summary: string | null;
  flashcards?: Flashcard[];
  questions?: QuizQuestion[];
};

@Processor('material-processing')
export class MaterialProcessor extends WorkerHost {
  private readonly logger = new Logger(MaterialProcessor.name);

  async process(
    job: Job<{ materialId: string; filePath: string; mimeType: string }>,
    _token?: string,
  ): Promise<any> {
    const { materialId, filePath, mimeType } = job.data;
    this.logger.log(`Processing material ${materialId}...`);

    try {
      const uploadRoot = resolve(
        process.env.UPLOAD_ROOT || resolve(process.cwd(), '..', '..', '.data', 'uploads'),
      );
      const fullPath = resolve(uploadRoot, filePath);
      const fileBuffer = await fs.readFile(fullPath);

      let aiContent: AiMaterialContent = { summary: null };
      if (
        mimeType === 'application/pdf' &&
        fileBuffer.length <= 5 * 1024 * 1024
      ) {
        try {
          aiContent = await this.generateAiContent(fileBuffer);
        } catch (error) {
          const reason =
            error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
          this.logger.warn(
            `AI learning content unavailable for material ${materialId}; continuing without it. ${reason}`,
          );
        }
      }

      await prisma.material.update({
        where: { id: materialId },
        data: {
          aiSummary: aiContent.summary,
          aiFlashcards: aiContent.flashcards,
          aiQuizQuestions: aiContent.questions,
          aiGeneratedAt: aiContent.summary ? new Date() : undefined,
          status: MaterialStatus.READY,
        },
      });

      this.logger.log(`Material ${materialId} processed successfully.`);
    } catch (error) {
      this.logger.error(`Error processing material ${materialId}:`, error);
      await prisma.material.update({
        where: { id: materialId },
        data: {
          status: MaterialStatus.FAILED,
        },
      });
      throw error;
    }
  }

  private async generateAiContent(fileBuffer: Buffer): Promise<AiMaterialContent> {
    const parser = new PDFParse({ data: fileBuffer });
    try {
      const pdfData = await parser.getText();
      const text = pdfData.text.replace(/\s+/g, ' ').trim().substring(0, 30000);
      if (text.length < 40) return { summary: null };
      const controller = new AbortController();
      const configuredTimeout = Number(process.env.AI_MATERIAL_TIMEOUT_MS || 60000);
      const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : 60000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const aiServiceBaseUrl = (process.env.AI_SERVICE_BASE_URL || process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1')
          .replace(/\/(summarize|material-content)\/?$/, '')
          .replace(/\/$/, '');
        const aiServiceUrl = `${aiServiceBaseUrl}/material-content`;
        const aiRes = await fetch(aiServiceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!aiRes.ok) return { summary: null };
        return this.validateAiContent(await aiRes.json());
      } finally {
        clearTimeout(timeoutId);
      }
    } finally {
      await parser.destroy();
    }
  }

  private validateAiContent(value: unknown): AiMaterialContent {
    if (!value || typeof value !== 'object') return { summary: null };
    const data = value as Record<string, unknown>;
    const summary = typeof data.summary === 'string' && data.summary.trim() ? data.summary.trim() : null;
    const flashcards = Array.isArray(data.flashcards)
      ? data.flashcards.filter((card): card is Flashcard => Boolean(
          card && typeof card === 'object' &&
          typeof (card as Flashcard).front === 'string' &&
          typeof (card as Flashcard).back === 'string',
        )).slice(0, 8)
      : undefined;
    const questions = Array.isArray(data.questions)
      ? data.questions.filter((question): question is QuizQuestion => Boolean(
          question && typeof question === 'object' &&
          typeof (question as QuizQuestion).question === 'string' &&
          Array.isArray((question as QuizQuestion).options) &&
          (question as QuizQuestion).options.length === 4 &&
          Number.isInteger((question as QuizQuestion).answer) &&
          (question as QuizQuestion).answer >= 0 &&
          (question as QuizQuestion).answer < 4,
        )).slice(0, 6)
      : undefined;
    return { summary, flashcards, questions };
  }
}
