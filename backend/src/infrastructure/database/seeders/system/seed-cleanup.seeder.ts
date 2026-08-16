import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Seeder } from '../seeder.interface';

@Injectable()
export class SeedCleanupSeeder implements Seeder {
  private readonly logger = new Logger(SeedCleanupSeeder.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed(): Promise<void> {
    this.logger.log('Clearing existing rows before the Syrian seed...');

    const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT IN (
          '_prisma_migrations',
          'spatial_ref_sys',
          'geography_columns',
          'geometry_columns'
        )
      ORDER BY tablename
    `;

    if (tables.length === 0) {
      this.logger.log('No application tables to clear.');
      return;
    }

    const quoted = tables.map((table) => `"${table.tablename}"`).join(', ');
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} CASCADE`);

    this.logger.log(`Cleared ${tables.length} tables.`);
  }
}
