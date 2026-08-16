import { BadRequestException, Injectable } from '@nestjs/common';
import { Transactional } from '../../../../../packages/transaction';
import { OrganizationUnitCommandRepository } from '../../infrastructure/repositories/organization-unit.command.repository';
import { OrganizationUnitQueryService } from './organization-unit.query.service';
import { TenantZoneQueryService } from '../../../tenant_zone/application/services/tenant-zone.query.service';
import { CreateOrganizationUnitDto } from '../dtos/requests/create-organization-unit.dto';
import { UpdateOrganizationUnitDto } from '../dtos/requests/update-organization-unit.dto';
import { AddLocationsDto } from '../dtos/requests/add-locations.dto';
import { GlobalLocationFacade } from '../../../../global-location/facades/global-location.facade';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import { ORG_UNIT_CACHE_KEYS } from '../../constants/organization-unit.cache.constants';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganizationUnitChangedEvent } from '../../domain/events/organization-unit-changed.event';

@Injectable()
export class OrganizationUnitCommandService {
  constructor(
    private readonly commandRepository: OrganizationUnitCommandRepository,
    private readonly queryService: OrganizationUnitQueryService,
    private readonly globalLocationFacade: GlobalLocationFacade,
    private readonly tenantZoneQueryService: TenantZoneQueryService,
    private readonly tenantFacade: TenantFacade,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @CacheEvict({
    keyPrefix: ORG_UNIT_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  @Transactional()
  async create(tenantId: string, dto: CreateOrganizationUnitDto) {
    if (dto.orgType === 'BRANCH') {
      const maxBranches =
        await this.tenantFacade.getMaxBranchesAllowed(tenantId);
      const currentBranches = await this.queryService.countByType(
        tenantId,
        'BRANCH',
      );
      if (maxBranches !== -1 && currentBranches >= maxBranches) {
        throw new BadRequestException(
          'تم تجاوز الحد الأقصى للفروع المسموح به في اشتراكك',
        );
      }
    } else if (dto.orgType === 'WAREHOUSE') {
      const maxWarehouses =
        await this.tenantFacade.getMaxWarehousesAllowed(tenantId);
      const currentWarehouses = await this.queryService.countByType(
        tenantId,
        'WAREHOUSE',
      );
      if (maxWarehouses !== -1 && currentWarehouses >= maxWarehouses) {
        throw new BadRequestException(
          'تم تجاوز الحد الأقصى للمستودعات المسموح به في اشتراكك',
        );
      }
    }
    if (dto.coverageLocations && dto.coverageLocations.length > 0) {
      const locationIds = dto.coverageLocations.map((c) => c.globalLocationId);
      const allExist =
        await this.globalLocationFacade.validateLocationsExist(locationIds);
      if (!allExist) {
        throw new BadRequestException(
          'One or more global location IDs provided for coverage are invalid.',
        );
      }
    }

    if (dto.parentId) {
      await this.queryService.findById(dto.parentId, tenantId);
    }

    if (dto.zoneId) {
      await this.tenantZoneQueryService.findById(dto.zoneId, tenantId);
    }

    const { id } = await this.commandRepository.create(tenantId, dto);

    this.eventEmitter.emitAsync(
      'organization-unit.changed',
      new OrganizationUnitChangedEvent(tenantId, null, dto.zoneId),
    );

    return { id };
  }

  @CacheEvict({
    keyPrefix: ORG_UNIT_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  @Transactional()
  async update(tenantId: string, id: string, dto: UpdateOrganizationUnitDto) {
    const existing = await this.queryService.findById(id, tenantId);

    if (dto.coverageLocations && dto.coverageLocations.length > 0) {
      const locationIds = dto.coverageLocations.map((c) => c.globalLocationId);
      const allExist =
        await this.globalLocationFacade.validateLocationsExist(locationIds);
      if (!allExist) {
        throw new BadRequestException(
          'One or more global location IDs provided for coverage are invalid.',
        );
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'Organization unit cannot be its own parent.',
        );
      }
      await this.queryService.findById(dto.parentId, tenantId);
    }

    if (dto.zoneId) {
      await this.tenantZoneQueryService.findById(dto.zoneId, tenantId);
    }

    await this.commandRepository.update(tenantId, id, dto);

    this.eventEmitter.emitAsync(
      'organization-unit.changed',
      new OrganizationUnitChangedEvent(tenantId, existing.zoneId, dto.zoneId),
    );

    return { id };
  }

  @CacheEvict({
    keyPrefix: ORG_UNIT_CACHE_KEYS.PREFIX,
    allEntries: true,
  })
  async addLocations(tenantId: string, id: string, dto: AddLocationsDto) {
    const existing = await this.queryService.findById(id, tenantId);

    if (dto.locations && dto.locations.length > 0) {
      const locationIds = dto.locations.map((c) => c.globalLocationId);
      const allExist =
        await this.globalLocationFacade.validateLocationsExist(locationIds);
      if (!allExist) {
        throw new BadRequestException(
          'One or more global location IDs provided are invalid.',
        );
      }

      await this.commandRepository.addLocations(tenantId, id, dto.locations);

      this.eventEmitter.emitAsync(
        'organization-unit.changed',
        new OrganizationUnitChangedEvent(
          tenantId,
          existing.zoneId,
          existing.zoneId,
        ),
      );
    }
  }
}
