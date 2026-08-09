import { Injectable, NotFoundException } from '@nestjs/common';
import { ZonePricingQueryRepository } from '../../infrastructure/repositories/zone-pricing.query.repository';
import { ZonePricingQueryDto } from '../dtos/requests/zone-pricing-query.dto';
import { ZonePricingResponseDto } from '../dtos/responses/zone-pricing.response.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';

@Injectable()
export class ZonePricingResolutionService {
  constructor(private readonly queryRepository: ZonePricingQueryRepository) {}

  async getPricingById(
    id: string,
    contextTenantId?: string,
  ): Promise<ZonePricingResponseDto> {
    const record = await this.queryRepository.findById(id);
    if (!record || (contextTenantId && record.tenantId !== contextTenantId)) {
      throw new NotFoundException('Pricing record not found');
    }
    return record;
  }

  async listPricing(
    query: ZonePricingQueryDto,
    contextTenantId?: string,
  ): Promise<CursorPaginatedResponse<ZonePricingResponseDto>> {
    const effectiveTenantId = contextTenantId || query.tenantId;
    return this.queryRepository.findMany(query, effectiveTenantId);
  }

  async resolvePrices(
    zonePairs: {
      tenantId: string;
      originZoneId: string;
      destinationZoneId: string;
    }[],
  ): Promise<Map<string, ZonePricingResponseDto[]>> {
    if (zonePairs.length === 0) return new Map();

    const prices =
      await this.queryRepository.findPricesForZonePairsV2(zonePairs);

    const priceMap = new Map<string, ZonePricingResponseDto[]>();
    for (const price of prices) {
      const key = `${price.tenantId}:${price.originZoneId}:${price.destinationZoneId}`;
      if (!priceMap.has(key)) {
        priceMap.set(key, []);
      }
      priceMap.get(key)!.push(price);
    }

    return priceMap;
  }
}
