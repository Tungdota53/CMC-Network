import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface StoredFile {
  /** Public URL the client uses to fetch the asset (relative or absolute). */
  url: string;
  /** Provider-specific key/path. Useful for deletes. */
  key: string;
  size: number;
  mimeType: string;
}

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  /** Logical bucket / folder, e.g. 'avatars', 'posts', 'materials'. */
  folder: string;
}

export interface StorageProvider {
  put(input: UploadInput): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

/** ----- Validation -------------------------------------------------------- */

export const IMAGE_MIME_WHITELIST = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const VIDEO_MIME_WHITELIST = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

export const DOCUMENT_MIME_WHITELIST = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
]);

export interface UploadValidationOptions {
  /** Hard upper bound. Default 25 MB. */
  maxSizeBytes?: number;
  /** Whitelist of allowed mime types. Defaults to images + documents. */
  allowedMimeTypes?: Set<string>;
  /** Convenience preset combining categories. */
  preset?: 'image' | 'video' | 'image+video' | 'document' | 'any';
}

export function validateUpload(file: { mimetype?: string; size?: number; originalname?: string }, opts: UploadValidationOptions = {}) {
  if (!file || !file.mimetype || !file.size) {
    throw new BadRequestException('File không hợp lệ');
  }

  const maxSize = opts.maxSizeBytes ?? 25 * 1024 * 1024; // 25 MB
  if (file.size > maxSize) {
    throw new BadRequestException(`File vượt quá kích thước cho phép (${Math.round(maxSize / 1024 / 1024)} MB)`);
  }

  const allowed = opts.allowedMimeTypes ?? presetWhitelist(opts.preset ?? 'image+video');
  if (allowed !== 'any' && !allowed.has(file.mimetype)) {
    throw new BadRequestException(`Định dạng file không được hỗ trợ: ${file.mimetype}`);
  }
}

function presetWhitelist(preset: NonNullable<UploadValidationOptions['preset']>): Set<string> | 'any' {
  switch (preset) {
    case 'image':
      return IMAGE_MIME_WHITELIST;
    case 'video':
      return VIDEO_MIME_WHITELIST;
    case 'image+video':
      return new Set([...IMAGE_MIME_WHITELIST, ...VIDEO_MIME_WHITELIST]);
    case 'document':
      return new Set([...IMAGE_MIME_WHITELIST, ...DOCUMENT_MIME_WHITELIST]);
    case 'any':
      return 'any';
  }
}

/** ----- Local provider (default) ----------------------------------------- */

export class LocalStorageProvider implements StorageProvider {
  /**
   * @param baseDir   absolute path on disk where files are written
   * @param urlPrefix public URL prefix (e.g. '/uploads')
   */
  constructor(
    private readonly baseDir: string,
    private readonly urlPrefix: string,
  ) {}

  async put(input: UploadInput): Promise<StoredFile> {
    const folderDir = join(this.baseDir, input.folder);
    await fs.mkdir(folderDir, { recursive: true });

    const ext = input.originalName.split('.').pop() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const fullPath = join(folderDir, safeName);
    await fs.writeFile(fullPath, input.buffer);

    return {
      url: `${this.urlPrefix}/${input.folder}/${safeName}`,
      key: `${input.folder}/${safeName}`,
      size: input.size,
      mimeType: input.mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.baseDir, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // ignore missing files
    }
  }
}

/** ----- Factory ----------------------------------------------------------- */

/**
 * Build the configured storage provider. Reads STORAGE_DRIVER env:
 *   - 'local'      → LocalStorageProvider (default)
 *   - 's3'         → not yet implemented (throws); placeholder for AWS SDK wiring
 *   - 'cloudinary' → not yet implemented (throws)
 *   - 'r2'         → not yet implemented (throws)
 *
 * Each service passes its own (baseDir, urlPrefix) so files land in the right
 * folder on disk during the local fallback.
 */
export function createStorageProvider(baseDir: string, urlPrefix: string): StorageProvider {
  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
  switch (driver) {
    case 'local':
      return new LocalStorageProvider(baseDir, urlPrefix);
    case 's3':
    case 'cloudinary':
    case 'r2':
      throw new Error(
        `STORAGE_DRIVER=${driver} chưa được triển khai. Hãy bổ sung adapter trong packages/common/src/storage.ts`,
      );
    default:
      throw new Error(`STORAGE_DRIVER không hợp lệ: ${driver}`);
  }
}
