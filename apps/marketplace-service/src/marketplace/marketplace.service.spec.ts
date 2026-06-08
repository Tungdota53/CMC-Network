import { MarketplaceService } from './marketplace.service';
import { prisma } from '@campus-connect/database';

jest.mock('@campus-connect/database', () => ({
  prisma: {
    product: { findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}));

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new MarketplaceService();
  });

  it('creates a product with the given seller id', async () => {
    jest.mocked(prisma.product.create).mockResolvedValue({ id: 'prod-1' } as never);
    await service.createProduct({ sellerId: 'seller-1', title: 'Laptop', price: 100, description: 'x' });
    const call = jest.mocked(prisma.product.create).mock.calls[0][0] as { data: { sellerId: string } };
    expect(call.data.sellerId).toBe('seller-1');
  });

  it('lists products filtered by status', async () => {
    jest.mocked(prisma.product.findMany).mockResolvedValue([] as never);
    await service.getProducts('AVAILABLE');
    expect(prisma.product.findMany).toHaveBeenCalled();
  });
});
