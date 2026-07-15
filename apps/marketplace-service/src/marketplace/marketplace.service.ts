import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@campus-connect/database';
import { ProductStatus } from '@prisma/client';
import {
  createStorageProvider,
  validateUpload,
  type StorageProvider,
} from '@campus-connect/common';
import { join } from 'path';

@Injectable()
export class MarketplaceService {
  private readonly maxImagesPerProduct = 8;

  private readonly storage: StorageProvider = createStorageProvider(
    join(process.cwd(), 'uploads'),
    '/uploads',
  );

  async getProducts(status?: string) {
    const filter = status ? { status: this.parseStatus(status) } : {};
    return prisma.product.findMany({
      where: filter,
      include: {
        seller: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async searchProducts(query: {
    keyword?: string;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
  }) {
    const where = {
      status: this.parseStatus(query.status ?? ProductStatus.AVAILABLE),
      ...(query.keyword
        ? {
            OR: [
              {
                title: {
                  contains: query.keyword,
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: query.keyword,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    return prisma.product.findMany({
      where,
      include: {
        seller: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(data: Record<string, unknown>) {
    const title = this.requireText(data.title, 'Tên sản phẩm');
    const price = this.parsePrice(data.price);

    return prisma.product.create({
      data: {
        sellerId: String(data.sellerId),
        title,
        price,
        description: this.optionalText(data.description) ?? '',
        category: this.optionalText(data.category) || 'Khác',
        condition: this.optionalText(data.condition) || 'NEW',
        location: this.optionalText(data.location) || undefined,
        images: this.normalizeImages(data.images),
        status: 'AVAILABLE',
      },
      include: {
        seller: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  /** Update a product. Only the seller may edit. */
  async updateProduct(
    productId: string,
    userId: string,
    data: Record<string, unknown>,
  ) {
    const product = await this.assertSeller(productId, userId);
    return prisma.product.update({
      where: { id: product.id },
      data: {
        title:
          data.title === undefined
            ? product.title
            : this.requireText(data.title, 'Tên sản phẩm'),
        price:
          data.price === undefined
            ? product.price
            : this.parsePrice(data.price),
        description:
          data.description === undefined
            ? product.description
            : (this.optionalText(data.description) ?? ''),
        category:
          data.category === undefined
            ? product.category
            : (this.optionalText(data.category) ?? product.category),
        condition:
          data.condition === undefined
            ? product.condition
            : (this.optionalText(data.condition) ?? product.condition),
        location:
          data.location === undefined
            ? product.location
            : this.optionalText(data.location),
        images:
          data.images === undefined
            ? product.images
            : this.normalizeImages(data.images),
      },
      include: {
        seller: { select: { id: true, fullName: true, avatarUrl: true } },
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
      data: { status: this.parseStatus(status) },
    });
  }

  /** Upload a product image (validated). Returns its public URL. */
  async uploadImage(file: {
    buffer: Buffer;
    originalname: string;
    mimetype?: string;
    size?: number;
  }) {
    validateUpload(
      {
        mimetype: file.mimetype,
        size: file.size ?? file.buffer.length,
        originalname: file.originalname,
      },
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

  async buyProduct(productId: string, buyerId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (product.status === 'SOLD')
      throw new ForbiddenException('Sản phẩm đã được bán');
    if (product.sellerId === buyerId)
      throw new ForbiddenException('Không thể mua sản phẩm của chính mình');

    return prisma.product.update({
      where: { id: productId },
      data: { status: 'SOLD', buyerId },
    });
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

  private parsePrice(value: unknown) {
    const price = Number(value);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Giá phải là số không âm');
    }
    return price;
  }

  private parseStatus(status: string) {
    if (!Object.values(ProductStatus).includes(status as ProductStatus)) {
      throw new BadRequestException('Trạng thái sản phẩm không hợp lệ');
    }
    return status as ProductStatus;
  }

  private normalizeImages(value: unknown) {
    if (!Array.isArray(value)) return [];

    const unique = Array.from(
      new Set(
        value
          .filter((url): url is string => typeof url === 'string')
          .map((url) => url.trim())
          .filter(Boolean),
      ),
    );

    return unique.slice(0, this.maxImagesPerProduct).map((url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (url.startsWith('/uploads/products/')) return url;
      if (url.startsWith('uploads/products/')) return `/${url}`;
      if (url.startsWith('/products/')) return `/uploads${url}`;
      if (url.startsWith('products/')) return `/uploads/${url}`;
      throw new BadRequestException('URL ảnh sản phẩm không hợp lệ');
    });
  }

  private async assertSeller(productId: string, userId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (product.sellerId !== userId) {
      throw new ForbiddenException('Chỉ người đăng bán mới có quyền này');
    }
    return product;
  }
}
