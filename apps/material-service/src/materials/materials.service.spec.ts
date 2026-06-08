import { MaterialsService } from './materials.service';
import { prisma } from '@campus-connect/database';

jest.mock('@campus-connect/database', () => ({
  FileType: { PDF: 'PDF', DOC: 'DOC', OTHER: 'OTHER' },
  prisma: {
    material: { findMany: jest.fn(), create: jest.fn() },
  },
}));

describe('MaterialsService — upload validation', () => {
  let service: MaterialsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new MaterialsService();
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
    jest.mocked(prisma.material.create).mockResolvedValue({ id: 'm1' } as never);
    await service.uploadMaterial({
      uploaderId: 'u1',
      title: 'Notes',
      subject: 'Math',
      fileType: 'PDF',
      fileBuffer: Buffer.from('%PDF-1.4'),
      fileName: 'notes.pdf',
      mimeType: 'application/pdf',
    });
    expect(prisma.material.create).toHaveBeenCalled();
  });
});
