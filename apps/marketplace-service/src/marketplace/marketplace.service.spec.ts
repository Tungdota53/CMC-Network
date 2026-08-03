import { MarketplaceService } from './marketplace.service';
import { prisma } from '@campus-connect/database';

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest
      .fn()
      .mockImplementation((args) =>
        Array.isArray(args) ? Promise.all(args) : args(mockPrisma),
      ),
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new MarketplaceService();
  });

  it('creates a product with the given seller id', async () => {
    jest
      .mocked(prisma.product.create)
      .mockResolvedValue({ id: 'prod-1' } as never);
    await service.createProduct({
      sellerId: 'seller-1',
      title: 'Laptop',
      price: 100,
      description: 'x',
    });
    const call = jest.mocked(prisma.product.create).mock.calls[0][0] as {
      data: { sellerId: string };
    };
    expect(call.data.sellerId).toBe('seller-1');
  });

  it('lists products filtered by status', async () => {
    jest.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    await service.getProducts('AVAILABLE');
    expect(prisma.product.findMany).toHaveBeenCalled();
  });

  it('claims an available product with one conditional update', async () => {
    jest
      .mocked(prisma.product.findUnique)
      .mockResolvedValueOnce({
        id: 'prod-1',
        sellerId: 'seller-1',
        status: 'AVAILABLE',
      } as never)
      .mockResolvedValueOnce({
        id: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        status: 'SOLD',
      } as never);
    jest.mocked(prisma.product.updateMany).mockResolvedValue({ count: 1 });

    await expect(
      service.buyProduct('prod-1', 'buyer-1'),
    ).resolves.toMatchObject({ buyerId: 'buyer-1', status: 'SOLD' });
    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'prod-1', status: 'AVAILABLE', buyerId: null },
      data: { status: 'SOLD', buyerId: 'buyer-1' },
    });
  });

  it('rejects the loser when another buyer claimed the product first', async () => {
    jest.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod-1',
      sellerId: 'seller-1',
      status: 'AVAILABLE',
    } as never);
    jest.mocked(prisma.product.updateMany).mockResolvedValue({ count: 0 });

    await expect(service.buyProduct('prod-1', 'buyer-2')).rejects.toThrow(
      'Sản phẩm đã được bán',
    );
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});
