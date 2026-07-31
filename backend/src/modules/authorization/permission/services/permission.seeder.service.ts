import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PERMISSION_CATALOG_ENTRIES } from '../catalog/permission.catalog';
import type { IPermissionCommandRepository } from '../interfaces/permission.command.repository.interface';
import { PERMISSION_COMMAND_REPOSITORY_TOKEN } from '../tokens/permission-repository.tokens';

/**
 * يزامن كتالوج الكود مع الجدول عند الإقلاع.
 *
 * الفشل لا يُسقط التطبيق: الكتالوج مرجع للقراءة، وإسقاط الخدمة كلها
 * لأن مزامنة مرجع فشلت أسوأ من العمل بكتالوج قديم لدورة نشر واحدة.
 */
@Injectable()
export class PermissionSeederService implements OnModuleInit {
  private readonly logger = new Logger(PermissionSeederService.name);

  constructor(
    @Inject(PERMISSION_COMMAND_REPOSITORY_TOKEN)
    private readonly permissionCommandRepository: IPermissionCommandRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    try {
      await this.permissionCommandRepository.syncCatalog(
        PERMISSION_CATALOG_ENTRIES,
      );

      this.logger.log(
        `Synced ${PERMISSION_CATALOG_ENTRIES.length} permissions from the code catalog`,
      );
    } catch (error) {
      this.logger.error(
        `Permission catalog sync failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
