export interface LocalStorageOptions {
  /** Default: './uploads' */
  uploadDir?: string;
  /** Default: '<uploadDir>/temp' */
  tempDir?: string;
}

export interface StorageModuleOptions {
  /**
   * Only 'local' is implemented today. Kept as a union so adding a
   * driver later (e.g. 's3') is a switch-case addition in the module
   * factory, not a breaking change to this interface.
   */
  driver?: 'local';

  local?: LocalStorageOptions;

  /** Register the module's exports globally (no re-import per feature module). Default: true */
  isGlobal?: boolean;

  /** Auto-run the hourly temp-file cleanup job. Default: true */
  enableTempCleanup?: boolean;

  /** Age (ms) before an orphaned temp file is purged. Default: 2 hours */
  maxTempFileAgeMs?: number;
}

export interface StorageModuleAsyncOptions {
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => Promise<StorageModuleOptions> | StorageModuleOptions;
  inject?: any[];
  /**
   * Whether the module is global. Declared here (not inside the
   * resolved StorageModuleOptions) because Nest needs to know this
   * synchronously, at module-graph build time — before your
   * useFactory has even run. Default: true.
   */
  isGlobal?: boolean;
}
