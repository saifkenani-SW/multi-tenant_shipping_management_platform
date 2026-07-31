import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import {
  STORAGE_MODULE_OPTIONS,
  STORAGE_PROVIDER,
} from './constants/storage.constants';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { TempFilesCleanupService } from './services/temp-files-cleanup.service';
import {
  StorageModuleAsyncOptions,
  StorageModuleOptions,
} from './interfaces/storage-module-options.interface';

@Module({})
export class StorageModule {
  /** Zero-config entry point: StorageModule.forRoot() in AppModule's imports gives you local storage at ./uploads. */
  static forRoot(options: StorageModuleOptions = {}): DynamicModule {
    return this.forRootAsync({
      useFactory: () => options,
      isGlobal: options.isGlobal,
    });
  }

  /** Config-driven entry point — e.g. reading the driver/paths from ConfigService. */
  static forRootAsync(options: StorageModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: STORAGE_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    // This is the "switch between providers" logic: it lives here,
    // inside the package's own module, not in the consuming app's
    // core. The app only ever injects STORAGE_PROVIDER and talks to
    // the IStorageProvider contract — it never imports LocalStorageProvider
    // (or, later, S3StorageProvider) directly.
    const storageProviderFactory: Provider = {
      provide: STORAGE_PROVIDER,
      useFactory: (opts: StorageModuleOptions) => {
        switch (opts.driver ?? 'local') {
          case 'local':
            return new LocalStorageProvider(opts.local);
          default:
            throw new Error(`Unsupported storage driver: "${opts.driver}"`);
        }
      },
      inject: [STORAGE_MODULE_OPTIONS],
    };

    return {
      module: StorageModule,
      global: options.isGlobal ?? true,
      imports: [ScheduleModule.forRoot(), ...(options.imports ?? [])],
      providers: [
        optionsProvider,
        storageProviderFactory,
        TempFilesCleanupService,
      ],
      exports: [STORAGE_PROVIDER],
    };
  }
}
