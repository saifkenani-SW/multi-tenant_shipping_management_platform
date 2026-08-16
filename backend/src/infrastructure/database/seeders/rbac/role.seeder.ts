import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { SEEDED_TENANTS } from '../tenant/tenant.seeder';

export const SEEDED_ROLES = [
  { name: 'Administrator', description: 'صلاحيات كاملة على عمليات الشركة' },
  {
    name: 'Branch Manager',
    description: 'إدارة أنشطة الفرع والموظفين',
  },
  { name: 'Driver', description: 'صلاحيات السائق للرحلات والتسليم' },
] as const;

@Injectable()
export class RoleSeeder implements Seeder {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting RoleSeeder...');

    const permissions = await this.prisma.permission.findMany({
      select: { id: true },
    });

    for (let i = 0; i < SEEDED_TENANTS.length; i++) {
      const tenant = SEEDED_TENANTS[i];

      for (let j = 0; j < SEEDED_ROLES.length; j++) {
        const roleData = SEEDED_ROLES[j];
        const roleId = `00000000-0000-7000-8000-0000000002${i}${j}`;

        const role = await this.prisma.role.upsert({
          where: {
            tenant_id_name: {
              tenant_id: tenant.id,
              name: roleData.name,
            },
          },
          update: {
            description: roleData.description,
            is_active: true,
          },
          create: {
            id: roleId,
            tenant_id: tenant.id,
            name: roleData.name,
            description: roleData.description,
            is_active: true,
          },
        });

        // Grant permissions to Administrator role
        if (roleData.name === 'Administrator') {
          for (const perm of permissions) {
            await this.prisma.role_permission.upsert({
              where: {
                role_id_permission_id: {
                  role_id: role.id,
                  permission_id: perm.id,
                },
              },
              update: {},
              create: {
                role_id: role.id,
                permission_id: perm.id,
              },
            });
          }
        }
      }
    }

    this.logger.log('RoleSeeder completed.');
  }
}
