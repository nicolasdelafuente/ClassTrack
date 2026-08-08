import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';

/** Local disk folder for note photos (CT-050). Relative to apps/api cwd. */
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'group-notes');

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_PER_UPLOAD = 10;

export function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function extensionForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '';
  }
}

export function assertImageFile(file: {
  mimetype: string;
  size: number;
  originalname: string;
}) {
  if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
    throw new BadRequestException(
      `Formato no permitido (${file.originalname}). Usá JPEG, PNG, WebP o GIF.`,
    );
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new BadRequestException(
      `Cada imagen debe pesar entre 1 byte y 5 MB (${file.originalname})`,
    );
  }
}

/** Save buffer to disk; returns the unique stored filename. */
export function saveImageToDisk(file: {
  mimetype: string
  buffer: Buffer
  originalname: string
  size?: number
}): string {
  assertImageFile({
    mimetype: file.mimetype,
    size: file.size ?? file.buffer.length,
    originalname: file.originalname,
  })
  ensureUploadsDir()
  const ext = extensionForMime(file.mimetype)
  const storedName = `${randomUUID()}${ext}`
  const fullPath = path.join(UPLOADS_DIR, storedName)
  fs.writeFileSync(fullPath, file.buffer)
  return storedName
}

export function deleteImageFromDisk(storedName: string) {
  if (!storedName || storedName.includes('..') || storedName.includes('/') || storedName.includes('\\')) {
    return;
  }
  const fullPath = path.join(UPLOADS_DIR, storedName);
  try {
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // best-effort cleanup
  }
}

/** Public URL path under the Nest global prefix `/api`. */
export function publicUrlForStoredName(storedName: string) {
  return `/api/uploads/group-notes/${encodeURIComponent(storedName)}`;
}
