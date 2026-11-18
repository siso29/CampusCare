import { Injectable } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export interface StorageProvider {
  save(buffer: Buffer, key: string, mimeType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

@Injectable()
export class LocalStorageService implements StorageProvider {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    void this.ensureDirExists();
  }

  private async ensureDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // directory already exists
    }
  }

  async save(buffer: Buffer, key: string): Promise<string> {
    await this.ensureDirExists();
    const filePath = join(this.uploadDir, key);
    await fs.writeFile(filePath, buffer);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    const filePath = join(this.uploadDir, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    await fs.unlink(filePath).catch(() => {});
  }
}
