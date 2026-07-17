import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { PrismaService } from './prisma.service';
import { TransactionalPrismaService } from '../../core/transaction';
import { DB } from './generated/kysely/types';

@Global()
@Module({
  providers: [
    PrismaService,
    TransactionalPrismaService,
    {
      provide: 'KYSELY_INSTANCE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Kysely<DB>({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString: configService.get<string>('DATABASE_URL'),
            }),
          }),
        });
      },
    },
  ],
  exports: [PrismaService, TransactionalPrismaService, 'KYSELY_INSTANCE'],
})
export class DatabaseModule {}
