import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { prisma, MaterialStatus } from '@campus-connect/database';
import { promises as fs } from 'fs';
import { join } from 'path';

@Processor('material-processing')
export class MaterialProcessor extends WorkerHost {
  private readonly logger = new Logger(MaterialProcessor.name);

  async process(job: Job<{ materialId: string; filePath: string; mimeType: string }>, token?: string): Promise<any> {
    const { materialId, filePath, mimeType } = job.data;
    this.logger.log(`Processing material ${materialId}...`);

    try {
      const fullPath = join(process.cwd(), 'uploads', filePath);
      const fileBuffer = await fs.readFile(fullPath);

      let aiSummary = null;
      if (mimeType === 'application/pdf' && fileBuffer.length <= 5 * 1024 * 1024) {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(fileBuffer);
        const text = pdfData.text.substring(0, 20000);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/summarize';
        const aiRes = await fetch(aiServiceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal as any
        });
        
        clearTimeout(timeoutId);
        
        if (aiRes.ok) {
          const resData = await aiRes.json();
          aiSummary = resData.summary;
        }
      }

      await prisma.material.update({
        where: { id: materialId },
        data: {
          aiSummary,
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
}
