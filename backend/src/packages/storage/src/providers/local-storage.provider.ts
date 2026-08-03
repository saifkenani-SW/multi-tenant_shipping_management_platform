import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import { dirname, extname, join } from 'path';
import { v7 as uuidv7 } from 'uuid';

import {
  IStorageProvider,
  StorageFile,
  StorageSaveResult,
} from '../contracts/storage-provider.interface';
import {
  StorageDeleteException,
  StorageNotFoundException,
  StorageWriteException,
} from '../exceptions/storage.exceptions';
import type { LocalStorageOptions } from '../interfaces/storage-module-options.interface';

@Injectable()
export class LocalStorageProvider<TCategory extends string = string>
  implements IStorageProvider<TCategory>, OnModuleInit
{
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly tempDir: string;

  constructor(options?: LocalStorageOptions) {
    this.uploadDir = options?.uploadDir ?? './uploads';
    this.tempDir = options?.tempDir ?? join(this.uploadDir, 'temp');
  }

  async onModuleInit(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  async save(
    file: StorageFile,
    ownerId: string,
    category: TCategory,
  ): Promise<StorageSaveResult> {
    const filename = `${uuidv7()}${extname(file.originalname)}`;
    const storageKey = join(ownerId, category, filename);
    const destination = join(this.uploadDir, storageKey);

    try {
      await fs.mkdir(dirname(destination), { recursive: true });

      if (file.buffer) {
        await fs.writeFile(destination, file.buffer);
      } else if (file.path) {
        await fs.rename(file.path, destination);
      } else {
        throw new Error('Invalid uploaded file: no buffer or path present');
      }

      return { storage_key: storageKey };
    } catch (error) {
      if (file.path) {
        await fs.unlink(file.path).catch(() => undefined);
      }

      this.logger.error(
        `Failed to save file ${file.originalname}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new StorageWriteException();
    }
  }

  async persistFromTemp(
    tempPath: string,
    ownerId: string,
    originalName: string,
    category: TCategory,
  ): Promise<StorageSaveResult> {
    const filename = `${uuidv7()}${extname(originalName)}`;
    const storageKey = join(ownerId, category, filename);
    const destination = join(this.uploadDir, storageKey);

    try {
      await fs.mkdir(dirname(destination), { recursive: true });
      await fs.copyFile(tempPath, destination);

      return { storage_key: storageKey };
    } catch (error) {
      this.logger.error(
        `Failed to persist temp file ${tempPath}`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new StorageWriteException();
    }
  }

  async get(storageKey: string): Promise<Readable> {
    const fullPath = join(this.uploadDir, storageKey);

    try {
      await fs.stat(fullPath);
    } catch {
      throw new StorageNotFoundException();
    }

    return createReadStream(fullPath);
  }

  async delete(storageKey: string): Promise<void> {
    const fullPath = join(this.uploadDir, storageKey);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;

      if (err.code === 'ENOENT') {
        return;
      }

      this.logger.error(`Failed deleting ${storageKey}`, err.stack);
      throw new StorageDeleteException();
    }
  }

  async deleteTemp(tempPath: string): Promise<void> {
    try {
      await fs.unlink(tempPath);
      this.logger.debug(`Deleted temp file: ${tempPath}`);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        this.logger.warn(
          `Failed to delete temp file ${tempPath}: ${err.message}`,
        );
      }
    }
  }
}
