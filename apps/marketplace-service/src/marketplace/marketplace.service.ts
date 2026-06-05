import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@campus-connect/database';

@Injectable()
export class MarketplaceService {
  async getProducts(status?: string) {
    const filter = status ? { status: status as any } : {};
    return prisma.product.findMany({
      where: filter,
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
        status: 'AVAILABLE',
      },
    });
  }

  async buyProduct(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { status: 'SOLD' },
    });
  }
}
