import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { createStorageProvider, validateUpload, type StorageProvider } from '@campus-connect/common';
import { join } from 'path';

@Injectable()
export class MarketplaceService {
  private readonly storage: StorageProvider = createStorageProvider(
    join(process.cwd(), 'uploads'),
    '/uploads',
  );

  async getProducts(status?: string) {
    const filter = status ? { status: status as any } : {};
    return prisma.product.findMany({
      where: filter,
      include: { seller: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchProducts(query: {
    keyword?: string;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }) {
    const where: any = {
      status: query.status ?? 'AVAILABLE',
    };

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.condition) where.condition = query.condition;
    
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    return prisma.product.findMany({
      where,
      include: { seller: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(data: any) {
    return prisma.product.create({
      data: {
        sellerId: data.sellerId,
        title: data.title,
        price: data.price,
        description: data.description,
        category: data.category || 'Other',
        condition: data.condition || 'New',
        images: Array.isArray(data.images) ? data.images : [],
        status: 'AVAILABLE',
      },
    });
  }

  /** Update a product. Only the seller may edit. */
  async updateProduct(productId: string, userId: string, data: any) {
    const product = await this.assertSeller(productId, userId);
    return prisma.product.update({
      where: { id: product.id },
      data: {
        title: data.title ?? product.title,
        price: data.price ?? product.price,
        description: data.description ?? product.description,
        category: data.category ?? product.category,
        condition: data.condition ?? product.condition,
        images: Array.isArray(data.images) ? data.images : product.images,
      },
    });
  }

  /** Delete a product. Only the seller may delete. */
  async deleteProduct(productId: string, userId: string) {
    await this.assertSeller(productId, userId);
    await prisma.product.delete({ where: { id: productId } });
    return { deleted: true, id: productId };
  }

  /** Change product status (e.g. AVAILABLE -> SOLD). Only the seller may do this. */
  async updateStatus(productId: string, userId: string, status: string) {
    await this.assertSeller(productId, userId);
    return prisma.product.update({
      where: { id: productId },
      data: { status: status as any },
    });
  }

  /** Upload a product image (validated). Returns its public URL. */
  async uploadImage(file: { buffer: Buffer; originalname: string; mimetype?: string; size?: number }) {
    validateUpload(
      { mimetype: file.mimetype, size: file.size ?? file.buffer.length, originalname: file.originalname },
      { preset: 'image', maxSizeBytes: 10 * 1024 * 1024 },
    );
    const stored = await this.storage.put({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size ?? file.buffer.length,
      folder: 'products',
    });
    return { url: stored.url };
  }

  async buyProduct(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { status: 'SOLD' },
    });
  }

  private async assertSeller(productId: string, userId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Chỉ người đăng bán mới có quyền này');
    }
    return product;
  }
}
