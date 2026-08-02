import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PERMISSION_CATALOG_ENTRIES } from '../catalog/permission.catalog';
import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class PermissionSeederService implements OnModuleInit {
  private readonly logger = new Logger(PermissionSeederService.name);

  constructor(private readonly permissionRepository: PermissionRepository) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    try {
      await this.permissionRepository.syncCatalog(PERMISSION_CATALOG_ENTRIES);

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
