import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { PrismaService } from './prisma.service';
import {
  TransactionalPrismaService,
  TransactionFacade,
} from '../../packages/transaction';
import { DB } from './generated/kysely/types';
import { AppConfigModule } from '../config/app-config.module';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    PrismaService,
    TransactionFacade,
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
  exports: [
    PrismaService,
    TransactionFacade,
    TransactionalPrismaService,
    'KYSELY_INSTANCE',
  ],
})
export class DatabaseModule {}
