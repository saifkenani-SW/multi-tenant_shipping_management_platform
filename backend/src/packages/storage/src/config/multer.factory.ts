import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { v7 as uuidv7 } from 'uuid';

export interface MulterFactoryOptions {
  tempDir?: string;
  maxFileSizeBytes?: number;
  maxFiles?: number;
}

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 10;

/** In-memory buffer storage — good for small files / direct-to-provider uploads. */
export function createMemoryMulterOptions(options: MulterFactoryOptions = {}) {
  return {
    storage: memoryStorage(),
    limits: {
      fileSize: options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES,
      files: options.maxFiles ?? DEFAULT_MAX_FILES,
    },
  };
}

/** Disk-backed temp storage — good for large files / worker-based persistence. */
export function createDiskMulterOptions(options: MulterFactoryOptions = {}) {
  const tempDir = options.tempDir ?? './uploads/temp';

  return {
    storage: diskStorage({
      destination: tempDir,
      filename: (_req, file, callback) => {
        callback(null, `${uuidv7()}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES,
      files: options.maxFiles ?? DEFAULT_MAX_FILES,
    },
  };
}
