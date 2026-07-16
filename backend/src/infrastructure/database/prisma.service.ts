import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// 1. استيرادات Prisma 7 الجديدة للاتصال الأصيل
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import {
  Kysely,
  PostgresAdapter as KyselyPostgresAdapter, // غيّرنا الاسم قليلاً لمنع التعارض
  PostgresIntrospector,
  PostgresQueryCompiler,
} from 'kysely';
import kyselyExtension from 'prisma-extension-kysely';
import type { DB } from './generated/kysely/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  // نقطة الدخول لاستعلامات Kysely المعقدة
  public readonly db: Kysely<DB>;

  constructor(private configService: ConfigService) {
    const dbUrl = configService.get<string>('DATABASE_URL');
    if (!dbUrl) {
      throw new Error('DATABASE_URL is missing in config!');
    }
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    // 2. إعداد الاتصال باستخدام Driver Adapter (الطريقة الإجبارية في Prisma 7)
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);

    super({
      adapter, // التمرير السحري للمُهايئ هنا
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });

    // دمج Kysely مع محرك Prisma
    const xprisma = this.$extends(
      kyselyExtension({
        kysely: (driver) =>
          new Kysely<DB>({
            dialect: {
              createAdapter: () => new KyselyPostgresAdapter(),
              createDriver: () => driver,
              createIntrospector: (db) => new PostgresIntrospector(db),
              createQueryCompiler: () => new PostgresQueryCompiler(),
            },
          }),
      }),
    );

    this.db = xprisma.$kysely;
  }

  async onModuleInit() {
    this.logger.log('Connecting to the database...');
    await this.$connect();
    this.logger.log('Database connected successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Closing database connection...');
    await this.$disconnect();
  }
}
