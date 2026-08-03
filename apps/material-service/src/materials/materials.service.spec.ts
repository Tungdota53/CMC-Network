import { MaterialsService } from './materials.service';
import { prisma } from '@campus-connect/database';

const mockStoragePut = jest.fn();
const mockStorageDelete = jest.fn();

jest.mock('@campus-connect/common', () => ({
  ...jest.requireActual('@campus-connect/common'),
  createStorageProvider: () => ({
    put: mockStoragePut,
    delete: mockStorageDelete,
  }),
}));

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest
      .fn()
      .mockImplementation((args) =>
        Array.isArray(args) ? Promise.all(args) : args(mockPrisma),
      ),
    material: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    FileType: { PDF: 'PDF', DOC: 'DOC', OTHER: 'OTHER' },
    prisma: mockPrisma,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

describe('MaterialsService — upload validation', () => {
  let service: MaterialsService;
  const mockQueue = { add: jest.fn().mockResolvedValue({}) };
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageDelete.mockResolvedValue(undefined);
    mockStoragePut.mockResolvedValue({
      url: '/uploads/materials/test.pdf',
      key: 'materials/test.pdf',
      size: 8,
      mimeType: 'application/pdf',
    });
    service = new MaterialsService(mockQueue as any);
  });

  it('rejects an oversized file (>50MB)', async () => {
    await expect(
      service.uploadMaterial({
        uploaderId: 'u1',
        title: 'Big',
        subject: 'Math',
        fileType: 'PDF',
        fileBuffer: Buffer.alloc(51 * 1024 * 1024),
        fileName: 'big.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toThrow(/kích thước/i);
    expect(prisma.material.create).not.toHaveBeenCalled();
  });

  it('rejects a disallowed mime type', async () => {
    await expect(
      service.uploadMaterial({
        uploaderId: 'u1',
        title: 'Bad',
        subject: 'Math',
        fileType: 'OTHER',
        fileBuffer: Buffer.from('x'),
        fileName: 'malware.exe',
        mimeType: 'application/x-msdownload',
      }),
    ).rejects.toThrow(/không được hỗ trợ/i);
  });

  it('accepts a valid PDF and persists it', async () => {
    jest
      .mocked(prisma.material.create)
      .mockResolvedValue({ id: 'm1' } as never);
    await service.uploadMaterial({
      uploaderId: 'u1',
      title: 'Notes',
      subject: 'Math',
      fileType: 'PDF',
      fileBuffer: Buffer.from('%PDF-1.4'),
      fileName: 'notes.pdf',
      mimeType: 'application/pdf',
    });
    expect(mockStoragePut).toHaveBeenCalledWith(
      expect.objectContaining({
        originalName: 'notes.pdf',
        folder: 'materials',
      }),
    );
    expect(prisma.material.create).toHaveBeenCalled();
  });

  it('deletes stored file when database creation fails', async () => {
    jest.mocked(prisma.material.create).mockRejectedValue(new Error('db down'));

    await expect(
      service.uploadMaterial({
        uploaderId: 'u1',
        title: 'Notes',
        subject: 'Math',
        fileType: 'PDF',
        fileBuffer: Buffer.from('%PDF-1.4'),
        fileName: 'notes.pdf',
        mimeType: 'application/pdf',
      }),
    ).rejects.toThrow('db down');
    expect(mockStorageDelete).toHaveBeenCalledWith('materials/test.pdf');
  });

  it('soft-deletes metadata before removing storage', async () => {
    jest.mocked(prisma.material.findUnique).mockResolvedValue({
      id: 'm1',
      uploaderId: 'u1',
      s3Url: '/uploads/materials/test.pdf',
    } as never);
    jest
      .mocked(prisma.material.update)
      .mockResolvedValue({ id: 'm1' } as never);

    await expect(service.deleteMaterial('m1', 'u1')).resolves.toEqual({
      deleted: true,
      id: 'm1',
    });
    expect(prisma.material.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mockStorageDelete).toHaveBeenCalledWith('materials/test.pdf');
  });
});

describe('MaterialsService — real catalog filters', () => {
  let service: MaterialsService;
  const mockQueue = { add: jest.fn().mockResolvedValue({}) };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MaterialsService(mockQueue as any);
    jest.mocked(prisma.material.findMany).mockResolvedValue([]);
  });

  it('only lists ready materials and applies search, subject and file type', async () => {
    await service.getMaterials({
      search: 'mạng máy tính',
      subject: 'INFO3006',
      fileType: 'PDF',
    });

    expect(prisma.material.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: 'READY',
          subject: { contains: 'INFO3006', mode: 'insensitive' },
          fileType: 'PDF',
          OR: [
            { title: { contains: 'mạng máy tính', mode: 'insensitive' } },
            { description: { contains: 'mạng máy tính', mode: 'insensitive' } },
            { tags: { has: 'mạng máy tính' } },
          ],
        }),
      }),
    );
  });

  it('ignores unsupported file types instead of producing an invalid query', async () => {
    await service.getMaterials({ fileType: 'Đề cương' });

    const call = jest.mocked(prisma.material.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(call.where).not.toHaveProperty('fileType');
  });
});
