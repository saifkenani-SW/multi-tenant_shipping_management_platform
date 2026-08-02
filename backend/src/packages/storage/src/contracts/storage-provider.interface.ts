import { Readable } from 'stream';

export interface StorageFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

export interface StorageSaveResult {
  storage_key: string;
}

/**
 * Contract every storage driver (Local, S3, ...) implements.
 *
 * `TCategory` lets a consuming app plug in its own category type
 * (a Prisma enum, a string union, whatever) without this package
 * ever depending on that app's generated types. It defaults to
 * `string`, so the package works out of the box with no category
 * type declared at all.
 */
export interface IStorageProvider<TCategory extends string = string> {
  save(
    file: StorageFile,
    ownerId: string,
    category: TCategory,
  ): Promise<StorageSaveResult>;

  /**
   * Used by background workers: copies a file already sitting in a
   * temp location into permanent storage. Does NOT delete the
   * original temp file — call deleteTemp() separately once the
   * caller is done with it.
   */
  persistFromTemp(
    tempPath: string,
    ownerId: string,
    originalName: string,
    category: TCategory,
  ): Promise<StorageSaveResult>;

  get(storageKey: string): Promise<Readable>;

  delete(storageKey: string): Promise<void>;

  deleteTemp(tempPath: string): Promise<void>;
}
