import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma, MaterialStatus } from '@campus-connect/database';
import { promises as fs } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { PDFParse } from 'pdf-parse';

const execFileAsync = promisify(execFile);

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

type MaterialJob = {
  materialId: string;
  filePath: string;
  mimeType: string;
  title?: string;
  subject?: string;
};

@Processor('material-processing')
export class MaterialProcessor extends WorkerHost {
  private readonly logger = new Logger(MaterialProcessor.name);

  async process(job: Job<MaterialJob>, _token?: string): Promise<any> {
    const { materialId, filePath, mimeType, title, subject } = job.data;
    this.logger.log(`Processing material ${materialId}...`);

    try {
      const uploadRoot = resolve(
        process.env.UPLOAD_ROOT ||
          resolve(process.cwd(), '..', '..', '.data', 'uploads'),
      );
      const fullPath = resolve(uploadRoot, filePath);
      const fileBuffer = await fs.readFile(fullPath);

      let aiContent: AiMaterialContent = { summary: null };
      const configuredMaxBytes = Number(
        process.env.AI_MATERIAL_MAX_FILE_BYTES || 50 * 1024 * 1024,
      );
      if (
        mimeType === 'application/pdf' &&
        fileBuffer.length <= configuredMaxBytes
      ) {
        try {
          aiContent = await this.generateAiContent(fileBuffer, {
            title,
            subject,
          });
        } catch (error) {
          const reason =
            error instanceof Error
              ? `${error.name}: ${error.message}`
              : 'Unknown error';
          this.logger.warn(
            `AI learning content unavailable for material ${materialId}; continuing without it. ${reason}`,
          );
        }
      }

      await prisma.material.update({
        where: { id: materialId },
        data: {
          aiSummary: aiContent.summary,
          aiFlashcards: aiContent.flashcards ?? [],
          aiQuizQuestions: aiContent.questions ?? [],
          aiGeneratedAt: aiContent.summary ? new Date() : null,
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

  private async generateAiContent(
    fileBuffer: Buffer,
    metadata: { title?: string; subject?: string },
  ): Promise<AiMaterialContent> {
    const parser = new PDFParse({ data: fileBuffer });
    try {
      const pdfData = await parser.getText();
      let text = this.normalizePdfText(pdfData.text);
      if (text.length < 80 || this.isLikelyGarbled(text)) {
        this.logger.warn(
          'PDF text extraction is empty or garbled; switching to Vietnamese OCR.',
        );
        text = this.normalizePdfText(await this.extractTextWithOcr(fileBuffer));
      }
      if (text.length < 80 || this.isLikelyGarbled(text)) {
        this.logger.warn('OCR did not produce reliable document text.');
        return { summary: null };
      }
      const controller = new AbortController();
      const configuredTimeout = Number(
        process.env.AI_MATERIAL_TIMEOUT_MS || 300000,
      );
      const timeoutMs =
        Number.isFinite(configuredTimeout) && configuredTimeout > 0
          ? configuredTimeout
          : 300000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const aiServiceBaseUrl = (
          process.env.AI_SERVICE_BASE_URL ||
          process.env.AI_SERVICE_URL ||
          'http://localhost:8000/api/v1'
        )
          .replace(/\/(summarize|material-content)\/?$/, '')
          .replace(/\/$/, '');
        const aiServiceUrl = `${aiServiceBaseUrl}/material-content`;
        const aiRes = await fetch(aiServiceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            title: metadata.title,
            subject: metadata.subject,
          }),
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

  private async extractTextWithOcr(fileBuffer: Buffer) {
    const workDir = await fs.mkdtemp(join(tmpdir(), 'cmc-material-ocr-'));
    const pdfPath = join(workDir, 'document.pdf');
    const pagePrefix = join(workDir, 'page');

    try {
      await fs.writeFile(pdfPath, fileBuffer);
      await execFileAsync(
        'pdftoppm',
        ['-jpeg', '-r', '180', pdfPath, pagePrefix],
        {
          maxBuffer: 10 * 1024 * 1024,
        },
      );
      const pageFiles = (await fs.readdir(workDir))
        .filter((name) => /^page-\d+\.jpg$/.test(name))
        .sort((left, right) =>
          left.localeCompare(right, undefined, { numeric: true }),
        );
      const pageTexts: string[] = [];

      for (const [index, pageFile] of pageFiles.entries()) {
        const { stdout } = await execFileAsync(
          'tesseract',
          [join(workDir, pageFile), 'stdout', '-l', 'vie+eng', '--psm', '6'],
          { maxBuffer: 10 * 1024 * 1024 },
        );
        if (stdout.trim())
          pageTexts.push(`[Trang ${index + 1}]\n${stdout.trim()}`);
      }

      return pageTexts.join('\n\n');
    } finally {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }

  private normalizePdfText(value: string) {
    return value
      .normalize('NFC')
      .split('')
      .map((character) => {
        const code = character.charCodeAt(0);
        const isFilteredControl =
          code === 127 ||
          (code < 32 && code !== 9 && code !== 10 && code !== 13);
        return isFilteredControl ? ' ' : character;
      })
      .join('')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private isLikelyGarbled(text: string) {
    const sample = text.slice(0, 12000);
    const suspicious = sample.match(/[�×Þ©¸®­µ¶¼½¾]/g)?.length ?? 0;
    const replacement = sample.match(/\uFFFD/g)?.length ?? 0;
    const words = sample.split(/\s+/).filter(Boolean);
    const malformedWords = words.filter((word) =>
      /[A-Za-zÀ-ỹ][×Þ©¸®­µ¶¼½¾]|[×Þ©¸®­µ¶¼½¾][A-Za-zÀ-ỹ]/.test(word),
    ).length;
    return (
      replacement > 0 ||
      suspicious / Math.max(sample.length, 1) > 0.012 ||
      malformedWords / Math.max(words.length, 1) > 0.08
    );
  }

  private validateAiContent(value: unknown): AiMaterialContent {
    if (!value || typeof value !== 'object') return { summary: null };
    const data = value as Record<string, unknown>;
    const summary =
      typeof data.summary === 'string' && data.summary.trim()
        ? data.summary.trim()
        : null;
    const flashcards = Array.isArray(data.flashcards)
      ? data.flashcards
          .filter((card): card is Flashcard =>
            Boolean(
              card &&
              typeof card === 'object' &&
              typeof (card as Flashcard).front === 'string' &&
              typeof (card as Flashcard).back === 'string',
            ),
          )
          .slice(0, 8)
      : undefined;
    const questions = Array.isArray(data.questions)
      ? data.questions
          .filter((question): question is QuizQuestion =>
            Boolean(
              question &&
              typeof question === 'object' &&
              typeof (question as QuizQuestion).question === 'string' &&
              Array.isArray((question as QuizQuestion).options) &&
              (question as QuizQuestion).options.length === 4 &&
              Number.isInteger((question as QuizQuestion).answer) &&
              (question as QuizQuestion).answer >= 0 &&
              (question as QuizQuestion).answer < 4,
            ),
          )
          .slice(0, 6)
      : undefined;
    if (!summary || !flashcards?.length || !questions?.length) {
      return { summary: null };
    }
    return { summary, flashcards, questions };
  }
}
