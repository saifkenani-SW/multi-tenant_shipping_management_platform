# nestjs-storage-kit

Driver-based file storage module for NestJS. Import it once in `AppModule`,
inject `STORAGE_PROVIDER` anywhere, and you have a working upload service.

Currently ships one driver — **local disk**. The contract and the module's
provider-switching logic are already driver-agnostic, so adding S3 (or
anything else) later is a new class + one `case` in the module factory —
no changes required in any app that already consumes the package.

## Install

```bash
npm install nestjs-storage-kit
# peer deps you likely already have in a NestJS app:
npm install @nestjs/schedule multer
```

## Quick start (zero config)

```ts
// app.module.ts
import { StorageModule } from 'nestjs-storage-kit';

@Module({
  imports: [StorageModule.forRoot()], // local disk, ./uploads, global
})
export class AppModule {}
```

```ts
// uploads.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { IStorageProvider, STORAGE_PROVIDER } from 'nestjs-storage-kit';

@Injectable()
export class UploadsService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider,
  ) {}

  save(file: Express.Multer.File, ownerId: string) {
    return this.storage.save(file, ownerId, 'attachments');
    //                                        ^ plain string category — works with no setup
  }
}
```

That's the whole integration. `AppModule` never imports `LocalStorageProvider`
directly — only the `StorageModule` and the `STORAGE_PROVIDER` token. When an
S3 driver ships later, switching is a config change (`driver: 's3'`), not a
code change.

## Config-driven setup

```ts
StorageModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    driver: 'local',
    local: {
      uploadDir: config.get('UPLOAD_DIR', './uploads'),
      tempDir: config.get('UPLOAD_TEMP_DIR'),
    },
    maxTempFileAgeMs: 4 * 60 * 60 * 1000, // 4h instead of the 2h default
  }),
  inject: [ConfigService],
})
```

## Typing your own category enum (optional)

The `category` parameter is `string` by default so the package needs no
knowledge of your schema. If you want compile-time safety against your own
enum (e.g. a generated Prisma enum), parametrize the interface at the call
site instead of inside the package:

```ts
import { AttachmentCategory } from '@prisma/client';
import { IStorageProvider, STORAGE_PROVIDER } from 'nestjs-storage-kit';

constructor(
  @Inject(STORAGE_PROVIDER)
  private readonly storage: IStorageProvider<AttachmentCategory>,
) {}
```

`LocalStorageProvider` itself is generic (`LocalStorageProvider<TCategory>`),
so this typing flows through end to end with zero changes inside the package.

## Multer config helpers

```ts
import { createDiskMulterOptions, createMemoryMulterOptions } from 'nestjs-storage-kit';

@UseInterceptors(FileInterceptor('file', createMemoryMulterOptions({ maxFileSizeBytes: 5 * 1024 * 1024 })))
```

## Error handling

Every failure is an `HttpException` subclass (`StorageNotFoundException`,
`StorageWriteException`, `StorageDeleteException`), each carrying a stable
`code` in its response body (`STORAGE_NOT_FOUND`, etc.) alongside a default
English `message`. Two ways to use this:

- **No custom filter** → Nest's default handling still returns the right
  HTTP status (404 / 500) with a JSON body. Works immediately.
- **App has a global exception filter** (for localized/branded error
  responses) → catch by `code` and rewrite `message` however you want,
  exactly like any other `HttpException` in the app.

## What changed vs. a single-app implementation

If you're migrating this out of an existing app's `src/core` +
`src/infrastructure`, three couplings were removed so the package has no
dependency on any one app:

| Before | After |
|---|---|
| `AttachmentCategory` imported from `@prisma/client` | `TCategory extends string` generic, defaults to `string` |
| App's own `ApiError` class | Package's own `HttpException` subclasses, works standalone |
| Hardcoded Arabic error strings | English defaults + stable `code`; app's filter can localize |
| Hardcoded `./uploads` path | `StorageModuleOptions.local.uploadDir` / `tempDir` |
| Hardcoded cleanup age / always-on cron | `maxTempFileAgeMs` / `enableTempCleanup` options |

## Roadmap

- `S3StorageProvider` (same `IStorageProvider` contract; selected via
  `driver: 's3'` in module options — no consumer-facing API change)
- Streaming `save()` variant for very large files
