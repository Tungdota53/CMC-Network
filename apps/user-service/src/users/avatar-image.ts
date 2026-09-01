import sharp from 'sharp';

export const AVATAR_THUMBNAIL_SIZE = 160;
export const AVATAR_DETAIL_MAX_SIZE = 1600;

export async function optimizeAvatar(buffer: Buffer) {
  const image = sharp(buffer, {
    failOn: 'error',
    limitInputPixels: 40_000_000,
  }).rotate();

  const [thumbnail, detail] = await Promise.all([
    image
      .clone()
      .resize(AVATAR_THUMBNAIL_SIZE, AVATAR_THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'centre',
        withoutEnlargement: true,
      })
      .webp({ quality: 76, effort: 4 })
      .toBuffer(),
    image
      .clone()
      .resize(AVATAR_DETAIL_MAX_SIZE, AVATAR_DETAIL_MAX_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 4 })
      .toBuffer(),
  ]);

  return { thumbnail, detail };
}
