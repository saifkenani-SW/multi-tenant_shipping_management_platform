import { Injectable } from '@nestjs/common';

import { TransactionalPrismaService } from '../../../../packages/transaction';
import { PermissionCatalogEntry } from '../catalog/permission.catalog';
import { IPermissionCommandRepository } from '../interfaces/permission.command.repository.interface';

@Injectable()
export class PermissionCommandRepository implements IPermissionCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  /**
   * upsert على `name` (وهو unique) حتى تكون العملية idempotent:
   * كل إقلاع يعيد المزامنة دون تكرار الصفوف.
   *
   * لا يحذف الصلاحيات المنزوعة من الكتالوج عمداً — الحذف يسقط صفوف
   * role_permission بالـ cascade ويسحب امتيازات قائمة بصمت. التنظيف
   * يبقى قراراً يدوياً عبر migration.
   */
  async syncCatalog(entries: readonly PermissionCatalogEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.prisma.client.permission.upsert({
        where: { name: entry.name },
        create: {
          name: entry.name,
          resource: entry.resource,
          action: entry.action,
          description: entry.description,
        },
        update: {
          resource: entry.resource,
          action: entry.action,
          description: entry.description,
        },
      });
    }
  }
}
