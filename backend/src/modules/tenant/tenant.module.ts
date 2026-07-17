import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantCommandService } from './services/tenant.command.service';
import { TenantQueryService } from './services/tenant.query.service';
import { TenantCommandRepository } from './repositories/tenant.command.repository';
import { TenantQueryRepository } from './repositories/tenant.query.repository';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';

@Module({
  imports: [CacheModule, DatabaseModule],
  controllers: [TenantController],
  providers: [
    {
      provide: 'ITenantCommandRepository',
      useClass: TenantCommandRepository,
    },
    {
      provide: 'ITenantQueryRepository',
      useClass: TenantQueryRepository,
    },
    {
      provide: 'ITenantCommandService',
      useClass: TenantCommandService,
    },
    {
      provide: 'ITenantQueryService',
      useClass: TenantQueryService,
    },
  ],
  exports: ['ITenantCommandService', 'ITenantQueryService'],
})
export class TenantModule {}
