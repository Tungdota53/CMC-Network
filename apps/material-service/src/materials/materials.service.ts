import { Injectable, NotFoundException } from '@nestjs/common';
import { FileType, prisma } from '@campus-connect/database';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class MaterialsService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'materials');

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  async getMaterials(subject?: string) {
    const filter = subject ? { subject: { contains: subject, mode: 'insensitive' as any } } : {};
    return prisma.material.findMany({
      where: filter,
      include: { uploader: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadMaterial(data: {
    uploaderId: string;
    title: string;
    subject: string;
    fileType: string;
    fileBuffer: Buffer;
    fileName: string;
  }) {
    const safeFileName = `${Date.now()}-${data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = join(this.uploadDir, safeFileName);

    await fs.writeFile(filePath, data.fileBuffer);

    const fileUrl = `/materials/${safeFileName}`;
    const validTypes = Object.values(FileType);
    const fileType = validTypes.includes(data.fileType.toUpperCase() as FileType)
      ? (data.fileType.toUpperCase() as FileType)
      : FileType.OTHER;

    return prisma.material.create({
      data: {
        uploaderId: data.uploaderId,
        title: data.title,
        s3Url: fileUrl,
        subject: data.subject,
        fileType,
      },
    });
  }
}
