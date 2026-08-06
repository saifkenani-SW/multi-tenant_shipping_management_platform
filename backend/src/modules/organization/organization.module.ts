import { Module } from '@nestjs/common';
import { GlobalLocationModule } from '../global-location/global-location.module';
import { TenantModule } from '../tenant/tenant.module';

import { OrganizationUnitController } from './organization_unit/presentation/controllers/organization-unit.controller';
import { OrganizationUnitCommandService } from './organization_unit/application/services/organization-unit.command.service';
import { OrganizationUnitQueryService } from './organization_unit/application/services/organization-unit.query.service';
import { OrganizationUnitCommandRepository } from './organization_unit/infrastructure/repositories/organization-unit.command.repository';
import { OrganizationUnitQueryRepository } from './organization_unit/infrastructure/repositories/organization-unit.query.repository';
import { TenantZoneController } from './tenant_zone/presentation/controllers/tenant-zone.controller';
import { TenantZoneCommandService } from './tenant_zone/application/services/tenant-zone.command.service';
import { TenantZoneQueryService } from './tenant_zone/application/services/tenant-zone.query.service';
import { TenantZoneCommandRepository } from './tenant_zone/infrastructure/repositories/tenant-zone.command.repository';
import { TenantZoneQueryRepository } from './tenant_zone/infrastructure/repositories/tenant-zone.query.repository';
import { OrganizationFacade } from './facades/organization.facade';
import { TenantZoneCacheListener } from './tenant_zone/presentation/listeners/tenant-zone-cache.listener';

@Module({
  imports: [GlobalLocationModule, TenantModule],
  controllers: [OrganizationUnitController, TenantZoneController],
  providers: [
    OrganizationUnitCommandService,
    OrganizationUnitQueryService,
    OrganizationUnitCommandRepository,
    OrganizationUnitQueryRepository,
    TenantZoneCommandService,
    TenantZoneQueryService,
    TenantZoneCommandRepository,
    TenantZoneQueryRepository,
    TenantZoneCacheListener,
    OrganizationFacade,
  ],
  exports: [OrganizationFacade],
})
export class OrganizationModule {}
