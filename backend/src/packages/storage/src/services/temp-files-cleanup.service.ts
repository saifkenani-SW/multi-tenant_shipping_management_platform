import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import { join } from 'path';

import { STORAGE_MODULE_OPTIONS } from '../constants/storage.constants';
import type { StorageModuleOptions } from '../interfaces/storage-module-options.interface';

@Injectable()
export class TempFilesCleanupService {
  private readonly logger = new Logger(TempFilesCleanupService.name);
  private readonly tempDir: string;
  private readonly maxAgeMs: number;
  private readonly enabled: boolean;

  constructor(@Inject(STORAGE_MODULE_OPTIONS) options: StorageModuleOptions) {
    const uploadDir = options.local?.uploadDir ?? './uploads';
    this.tempDir = options.local?.tempDir ?? join(uploadDir, 'temp');
    this.maxAgeMs = options.maxTempFileAgeMs ?? 2 * 60 * 60 * 1000;
    this.enabled = options.enableTempCleanup ?? true;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanup(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    this.logger.log('Running temp files cleanup...');

    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const fullPath = join(this.tempDir, file);
        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch {
          continue;
        }

        if (now - stat.mtimeMs < this.maxAgeMs) {
          continue;
        }

        try {
          await fs.unlink(fullPath);
          this.logger.log(`Deleted expired temp file: ${file}`);
        } catch (error) {
          const err = error as NodeJS.ErrnoException;
          if (err.code !== 'ENOENT') {
            throw err;
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to cleanup temp directory',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
