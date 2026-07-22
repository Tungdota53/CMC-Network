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
import { resolve } from 'path';

@Injectable()
export class MaterialsService {
  private readonly storageProvider = createStorageProvider(
    resolve(process.env.UPLOAD_ROOT || resolve(process.cwd(), '..', '..', '.data', 'uploads')),
    process.env.UPLOAD_PUBLIC_BASE_URL || '/uploads',
  );

  private readonly invalidMaterialIds = new Set(['undefined', 'null', '']);

  constructor(
    @InjectQueue('material-processing') private materialQueue: Queue,
  ) {}

  async getMaterials(filters: {
    subject?: string;
    search?: string;
    fileType?: string;
  } = {}) {
    const subject = filters.subject?.trim();
    const search = filters.search?.trim();
    const supportedTypes = new Set([
      'PDF',
      'DOCX',
      'PPTX',
      'XLSX',
      'ZIP',
      'OTHER',
    ]);
    const fileType = filters.fileType?.toUpperCase();
    const where = {
      deletedAt: null,
      status: 'READY' as const,
      ...(subject
        ? { subject: { contains: subject, mode: 'insensitive' as const } }
        : {}),
      ...(fileType && supportedTypes.has(fileType)
        ? { fileType: fileType as any }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              {
                description: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              { tags: { has: search } },
            ],
          }
        : {}),
    };
    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { bookmarks: true } },
        uploader: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
    return materials.map((material: any) => ({
      ...material,
      bookmarkCount: material._count.bookmarks,
    }));
  }

  async getLegacyRecommendations() {
    return prisma.material.findMany({
      where: {
        deletedAt: null,
        status: 'READY',
      },
      orderBy: [{ rating: 'desc' }, { downloadCount: 'desc' }],
      take: 4,
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
  }

  async getMaterial(materialId: string) {
    this.assertValidMaterialId(materialId);

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        _count: { select: { bookmarks: true } },
        uploader: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });
    if (!material) throw new NotFoundException('Không tìm thấy tài liệu');
    const materialWithCounts = material as any;
    return {
      ...materialWithCounts,
      bookmarkCount: materialWithCounts._count.bookmarks,
      aiSummary: material.aiGeneratedAt ? material.aiSummary : null,
      aiFlashcards: material.aiGeneratedAt && Array.isArray(material.aiFlashcards)
        ? material.aiFlashcards
        : [],
      aiQuizQuestions: material.aiGeneratedAt && Array.isArray(material.aiQuizQuestions)
        ? material.aiQuizQuestions
        : [],
      aiContentSource: material.aiGeneratedAt ? 'document' : 'unavailable',
    };
  }

  async getFlashcards(materialId: string) {
    const material = await this.getMaterial(materialId);
    return material.aiFlashcards;
  }

  async getQuiz(materialId: string) {
    const material = await this.getMaterial(materialId);
    return material.aiQuizQuestions;
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
    const title = this.requireText(data.title, 'Tên tài liệu');
    const subject = this.requireText(data.subject, 'Môn học');

    validateUpload(
      {
        mimetype: data.mimeType || 'application/octet-stream',
        size: data.fileBuffer?.length ?? 0,
        originalname: data.fileName,
      },
      { preset: 'document', maxSizeBytes: 20 * 1024 * 1024 },
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
        title,
        s3Url: fileUrl,
        subject,
        description: this.optionalText(
          (data as { description?: unknown }).description,
        ),
        semester: this.optionalText((data as { semester?: unknown }).semester),
        tags: this.normalizeTags((data as { tags?: unknown }).tags),
        fileSize: this.formatFileSize(data.fileBuffer.length),
        fileType,
        status: 'PROCESSING',
      },
    });

    // Add job to queue
    await this.materialQueue.add('process', {
      materialId: material.id,
      filePath: storedFile.key,
      mimeType: data.mimeType || 'application/pdf',
      title,
      subject,
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
        title:
          data.title === undefined
            ? material.title
            : this.requireText(data.title, 'Tên tài liệu'),
        description:
          data.description === undefined
            ? material.description
            : this.optionalText(data.description),
        subject:
          data.subject === undefined
            ? material.subject
            : this.requireText(data.subject, 'Môn học'),
        semester:
          data.semester === undefined
            ? material.semester
            : this.optionalText(data.semester),
        tags:
          data.tags === undefined
            ? material.tags
            : this.normalizeTags(data.tags),
      },
    });
  }

  /** Delete a material. Only the uploader may delete. */
  async deleteMaterial(materialId: string, userId: string) {
    const material = await this.assertUploader(materialId, userId);
    await prisma.material.delete({ where: { id: materialId } });

    if (material.s3Url) {
      const key = this.storageKeyFromUrl(material.s3Url);
      await this.storageProvider.delete(key);
    }

    return { deleted: true, id: materialId };
  }

  /** Increment download counter and return the new total. */
  async incrementDownload(materialId: string) {
    this.assertValidMaterialId(materialId);

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
    this.assertValidMaterialId(materialId);

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
    this.assertValidMaterialId(materialId);

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
    this.assertValidMaterialId(materialId);

    return prisma.materialReview.findMany({
      where: { materialId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
  }

  /** Toggle bookmark for a material. Returns { bookmarked }. */
  async toggleBookmark(materialId: string, userId: string) {
    this.assertValidMaterialId(materialId);

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
            uploader: {
              select: { fullName: true, avatarUrl: true, isVerified: true },
            },
          },
        },
      },
    });
    return rows.map((r) => r.material);
  }

  private assertValidMaterialId(materialId: string) {
    if (this.invalidMaterialIds.has(materialId)) {
      throw new BadRequestException('Mã tài liệu không hợp lệ');
    }
  }

  private requireText(value: unknown, field: string) {
    const text = this.optionalText(value);
    if (!text) throw new BadRequestException(`${field} không được để trống`);
    return text;
  }

  private optionalText(value: unknown) {
    if (typeof value !== 'string') return undefined;
    const text = value.trim();
    return text.length ? text.slice(0, 5000) : undefined;
  }

  private normalizeTags(value: unknown) {
    if (!Array.isArray(value)) return [];
    return Array.from(
      new Set(
        value
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    ).slice(0, 20);
  }

  private formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024)
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private storageKeyFromUrl(url: string) {
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    return path
      .replace(/^\/uploads\//, '')
      .replace(/^uploads\//, '')
      .replace(/^\//, '');
  }

}
