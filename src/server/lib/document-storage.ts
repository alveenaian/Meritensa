import fs from 'node:fs/promises';
import path from 'node:path';

export async function readUploadedFile(storagePath: string): Promise<Buffer> {
  const fullPath = path.resolve(storagePath);
  return await fs.readFile(fullPath);
}

export async function deleteUploadedFile(storagePath: string): Promise<void> {
  const fullPath = path.resolve(storagePath);
  await fs.unlink(fullPath);
}
