import sharp from 'sharp';
import {
  AVATAR_DETAIL_MAX_SIZE,
  AVATAR_THUMBNAIL_SIZE,
  optimizeAvatar,
} from './avatar-image';

describe('optimizeAvatar', () => {
  it('creates a square WebP thumbnail and bounded detail image', async () => {
    const input = await sharp({
      create: {
        width: 2400,
        height: 1200,
        channels: 3,
        background: '#22c55e',
      },
    })
      .jpeg({ quality: 95 })
      .toBuffer();

    const result = await optimizeAvatar(input);
    const thumbnail = await sharp(result.thumbnail).metadata();
    const detail = await sharp(result.detail).metadata();

    expect(thumbnail).toMatchObject({
      width: AVATAR_THUMBNAIL_SIZE,
      height: AVATAR_THUMBNAIL_SIZE,
      format: 'webp',
    });
    expect(detail.format).toBe('webp');
    expect(detail.width).toBeLessThanOrEqual(AVATAR_DETAIL_MAX_SIZE);
    expect(detail.height).toBeLessThanOrEqual(AVATAR_DETAIL_MAX_SIZE);
    expect(result.thumbnail.length).toBeLessThan(input.length);
  });

  it('rejects invalid image bytes', async () => {
    await expect(optimizeAvatar(Buffer.from('not-an-image'))).rejects.toThrow();
  });
});
