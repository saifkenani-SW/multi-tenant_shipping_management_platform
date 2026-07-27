import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';
import { DEMO_TENANTS } from './tenant.seeder';

const ADMINISTRATOR_ROLE = {
  name: 'Administrator',
  description: 'Full access to tenant operations',
};

@Injectable()
export class RoleSeeder implements Seeder {
  private readonly logger = new Logger(RoleSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Starting...');

    const [tenants, permissions] = await Promise.all([
      this.prisma.tenant.findMany({
        where: { id: { in: DEMO_TENANTS.map((tenant) => tenant.id) } },
        select: { id: true },
      }),
      this.prisma.permission.findMany({ select: { id: true } }),
    ]);

    let processedCount = 0;

    for (const tenant of tenants) {
      const role = await this.prisma.role.upsert({
        where: {
          tenant_id_name: {
            tenant_id: tenant.id,
            name: ADMINISTRATOR_ROLE.name,
          },
        },
        update: {
          description: ADMINISTRATOR_ROLE.description,
          is_active: true,
        },
        create: {
          tenant_id: tenant.id,
          name: ADMINISTRATOR_ROLE.name,
          description: ADMINISTRATOR_ROLE.description,
          is_active: true,
        },
      });

      processedCount++;

      for (const permission of permissions) {
        await this.prisma.role_permission.upsert({
          where: {
            role_id_permission_id: {
              role_id: role.id,
              permission_id: permission.id,
            },
          },
          update: {},
          create: {
            role_id: role.id,
            permission_id: permission.id,
          },
        });
      }
    }

    this.logger.log('Completed.');
    this.logger.log(`Number of processed records: ${processedCount}.`);
  }
}
