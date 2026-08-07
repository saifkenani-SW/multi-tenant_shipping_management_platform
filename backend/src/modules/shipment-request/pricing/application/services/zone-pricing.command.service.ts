import { BadRequestException, Injectable } from '@nestjs/common';
import { ZonePricingCommandRepository } from '../../infrastructure/repositories/zone-pricing.command.repository';
import { CreateZonePricingDto } from '../dtos/requests/create-zone-pricing.dto';
import { UpdateZonePricingDto } from '../dtos/requests/update-zone-pricing.dto';
import { ZonePricingQueryService } from './zone-pricing.query.service';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { CacheEvict } from '../../../../../infrastructure/cache/decorators/CacheEvict';
import { Transactional } from '../../../../../packages/transaction';
import { PRICING_CACHE_KEYS } from '../../constants/pricing.cache.constants';

@Injectable()
export class ZonePricingCommandService {
  constructor(
    private readonly commandRepository: ZonePricingCommandRepository,
    private readonly queryService: ZonePricingQueryService,
    private readonly organizationFacade: OrganizationFacade,
  ) {}

  @CacheEvict({ keyPrefix: PRICING_CACHE_KEYS.LIST, allEntries: true })
  @Transactional()
  async createPricing(
    tenantId: string,
    dto: CreateZonePricingDto,
  ): Promise<{ id?: string; ids?: string[] }> {
    const validZones = await this.organizationFacade.validateTenantZonesExist(
      tenantId,
      [dto.originZoneId, dto.destinationZoneId],
    );
    if (!validZones) {
      throw new BadRequestException(
        'One or more zones provided do not exist or belong to another tenant.',
      );
    }

    let result: { id?: string; ids?: string[] } = {};

    if (dto.isBidirectional) {
      // Create two records
      const dtos: CreateZonePricingDto[] = [
        { ...dto }, // Origin -> Destination
        {
          ...dto,
          originZoneId: dto.destinationZoneId,
          destinationZoneId: dto.originZoneId,
        }, // Destination -> Origin
      ];

      const records = await Promise.all(
        dtos.map((d) => this.commandRepository.create(tenantId, d)),
      );
      result = { ids: records.map((r) => r.id) };
    } else {
      result = await this.commandRepository.create(tenantId, dto);
    }

    return result;
  }

  @CacheEvict({ keyPrefix: PRICING_CACHE_KEYS.PREFIX, allEntries: true })
  async updatePricing(
    tenantId: string,
    id: string,
    dto: UpdateZonePricingDto,
  ): Promise<{ id: string }> {
    await this.queryService.getPricingById(id, tenantId);
    const result = await this.commandRepository.update(id, dto);

    return result;
  }

  @CacheEvict({ keyPrefix: PRICING_CACHE_KEYS.PREFIX, allEntries: true })
  @Transactional()
  async deletePricing(tenantId: string, id: string): Promise<void> {
    await this.queryService.getPricingById(id, tenantId);
    await this.commandRepository.delete(id);
  }
}
