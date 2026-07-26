import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Permission } from '../../../core/security/Permission';
@Injectable()
export class PermissionSeeder {
  private readonly logger = new Logger(PermissionSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed() {
    this.logger.log('Starting Permission Seed...');

    const permissions = Object.values(Permission);
    let syncedCount = 0;

    for (const permissionName of permissions) {
      const parts = permissionName.split('_');
      const action = parts[0];
      const resource = parts.slice(1).join('_') || 'SYSTEM';

      await this.prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          action,
          resource,
          description: `Permission to ${permissionName.replace(/_/g, ' ').toLowerCase()}`,
        },
      });
      syncedCount++;
    }

    this.logger.log(`Successfully synced ${syncedCount} permissions.`);
  }
}
