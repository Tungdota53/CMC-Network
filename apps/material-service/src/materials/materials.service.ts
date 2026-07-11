import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FileType, prisma } from '@campus-connect/database';
import { validateUpload, createStorageProvider } from '@campus-connect/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class MaterialsService {
  private readonly storageProvider = createStorageProvider(
    join(process.cwd(), 'uploads'),
    '',
  );

  constructor(
    @InjectQueue('material-processing') private materialQueue: Queue,
  ) {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(join(process.cwd(), 'uploads', 'materials'), {
        recursive: true,
      });
    } catch {
      // Directory already exists
    }
  }

  async getMaterials(subject?: string) {
    const where = subject
      ? { subject: { contains: subject, mode: 'insensitive' as const } }
      : {};
    return prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async uploadMaterial(data: {
    uploaderId: string;
    title: string;
    subject: string;
    fileType: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType?: string;
  }) {
    validateUpload(
      {
        mimetype: data.mimeType || 'application/octet-stream',
        size: data.fileBuffer?.length ?? 0,
        originalname: data.fileName,
      },
      { preset: 'document', maxSizeBytes: 50 * 1024 * 1024 },
    );

    const storedFile = await this.storageProvider.put({
      buffer: data.fileBuffer,
      originalName: data.fileName,
      mimeType: data.mimeType || 'application/pdf',
      size: data.fileBuffer.length,
      folder: 'materials',
    });

    const fileUrl = storedFile.url;
    const validTypes = Object.values(FileType);
    const fileType = validTypes.includes(
      data.fileType.toUpperCase() as FileType,
    )
      ? (data.fileType.toUpperCase() as FileType)
      : FileType.OTHER;

    // Create material with PROCESSING status
    const material = await prisma.material.create({
      data: {
        uploaderId: data.uploaderId,
        title: data.title,
        s3Url: fileUrl,
        subject: data.subject,
        fileType,
        status: 'PROCESSING',
      },
    });

    // Add job to queue
    await this.materialQueue.add('process', {
      materialId: material.id,
      filePath: storedFile.key,
      mimeType: data.mimeType || 'application/pdf',
    });

    return material;
  }

  /** Update material metadata. Only the uploader may edit. */
  async updateMaterial(
    materialId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      subject?: string;
      semester?: string;
      tags?: string[];
    },
  ) {
    const material = await this.assertUploader(materialId, userId);
    return prisma.material.update({
      where: { id: material.id },
      data: {
        title: data.title ?? material.title,
        description: data.description ?? material.description,
        subject: data.subject ?? material.subject,
        semester: data.semester ?? material.semester,
        tags: data.tags ?? material.tags,
      },
    });
  }

  /** Delete a material. Only the uploader may delete. */
  async deleteMaterial(materialId: string, userId: string) {
    const material = await this.assertUploader(materialId, userId);
    await prisma.material.delete({ where: { id: materialId } });

    if (material.s3Url) {
      const key = material.s3Url.startsWith('/')
        ? material.s3Url.substring(1)
        : material.s3Url;
      await this.storageProvider.delete(key);
    }

    return { deleted: true, id: materialId };
  }

  /** Increment download counter and return the new total. */
  async incrementDownload(materialId: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true },
    });
    if (!material) throw new NotFoundException('Không tìm thấy tài liệu');
    const updated = await prisma.material.update({
      where: { id: materialId },
      data: { downloadCount: { increment: 1 } },
      select: { id: true, downloadCount: true, s3Url: true },
    });
    return updated;
  }

  private async assertUploader(materialId: string, userId: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });
    if (!material) throw new NotFoundException('Không tìm thấy tài liệu');
    if (material.uploaderId !== userId) {
      throw new ForbiddenException('Chỉ người tải lên mới có quyền này');
    }
    return material;
  }

  /** Add or update a user's review; recomputes the material's average rating. */
  async reviewMaterial(
    materialId: string,
    userId: string,
    rating: number,
    comment?: string,
  ) {
    if (rating < 1 || rating > 5)
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5');
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true },
    });
    if (!material) throw new NotFoundException('Không tìm thấy tài liệu');

    const review = await prisma.materialReview.upsert({
      where: { materialId_userId: { materialId, userId } },
      create: { materialId, userId, rating, comment },
      update: { rating, comment },
    });

    const stats = await prisma.materialReview.aggregate({
      where: { materialId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.material.update({
      where: { id: materialId },
      data: {
        rating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });

    return review;
  }

  /** List reviews for a material. */
  async getReviews(materialId: string) {
    return prisma.materialReview.findMany({
      where: { materialId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  /** Toggle bookmark for a material. Returns { bookmarked }. */
  async toggleBookmark(materialId: string, userId: string) {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true },
    });
    if (!material) throw new NotFoundException('Không tìm thấy tài liệu');

    const existing = await prisma.materialBookmark.findUnique({
      where: { materialId_userId: { materialId, userId } },
    });
    if (existing) {
      await prisma.materialBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }
    await prisma.materialBookmark.create({ data: { materialId, userId } });
    return { bookmarked: true };
  }

  /** Materials a user has bookmarked. */
  async getBookmarks(userId: string) {
    const rows = await prisma.materialBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        material: {
          include: {
            uploader: { select: { fullName: true, avatarUrl: true } },
          },
        },
      },
    });
    return rows.map((r) => r.material);
  }
}
