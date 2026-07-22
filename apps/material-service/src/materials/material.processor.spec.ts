import { MaterialProcessor } from './material.processor';
import { prisma, MaterialStatus } from '@campus-connect/database';
import { promises as fs } from 'fs';

jest.mock('fs', () => ({
  promises: { readFile: jest.fn() },
}));

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({
      text: 'Sắp xếp nổi bọt so sánh hai phần tử kề nhau và đổi chỗ khi sai thứ tự. Độ phức tạp trung bình là O(n²).',
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@campus-connect/database', () => ({
  MaterialStatus: { READY: 'READY', FAILED: 'FAILED' },
  prisma: {
    material: { update: jest.fn() },
  },
}));

describe('MaterialProcessor', () => {
  const updateMaterial = prisma.material.update as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('pdf'));
    updateMaterial.mockResolvedValue({});
  });

  it('marks a material READY when optional AI summarization times out', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'));
    const processor = new MaterialProcessor();

    await expect(
      processor.process({
        data: {
          materialId: 'material-1',
          filePath: 'materials/document.pdf',
          mimeType: 'application/pdf',
        },
      } as never),
    ).resolves.toBeUndefined();

    expect(updateMaterial).toHaveBeenCalledWith({
      where: { id: 'material-1' },
      data: {
        aiSummary: null,
        aiFlashcards: undefined,
        aiQuizQuestions: undefined,
        aiGeneratedAt: undefined,
        status: MaterialStatus.READY,
      },
    });
    expect(updateMaterial).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: MaterialStatus.FAILED } }),
    );

    fetchSpy.mockRestore();
  });

  it('persists structured learning content generated from extracted PDF text', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        summary: 'Tóm tắt từ nội dung PDF',
        flashcards: [{ front: 'Sắp xếp nổi bọt là gì?', back: 'Một thuật toán sắp xếp.' }],
        questions: [{
          question: 'Độ phức tạp trung bình là gì?',
          options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
          answer: 1,
          explanation: 'Hai vòng lặp lồng nhau.',
        }],
      }),
    } as never);
    const processor = new MaterialProcessor();

    await processor.process({
      data: {
        materialId: 'material-2',
        filePath: 'materials/bubble-sort.pdf',
        mimeType: 'application/pdf',
      },
    } as never);

    expect(updateMaterial).toHaveBeenCalledWith({
      where: { id: 'material-2' },
      data: expect.objectContaining({
        aiSummary: 'Tóm tắt từ nội dung PDF',
        aiFlashcards: [{ front: 'Sắp xếp nổi bọt là gì?', back: 'Một thuật toán sắp xếp.' }],
        aiQuizQuestions: [expect.objectContaining({ answer: 1 })],
        aiGeneratedAt: expect.any(Date),
        status: MaterialStatus.READY,
      }),
    });
    fetchSpy.mockRestore();
  });
});
