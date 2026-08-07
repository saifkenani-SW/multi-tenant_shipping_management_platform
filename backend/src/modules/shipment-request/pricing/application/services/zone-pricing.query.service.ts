import { Injectable, NotFoundException } from '@nestjs/common';
import { ZonePricingQueryRepository } from '../../infrastructure/repositories/zone-pricing.query.repository';
import { ZonePricingQueryDto } from '../dtos/requests/zone-pricing-query.dto';
import { ZonePricingResponseDto } from '../dtos/responses/zone-pricing.response.dto';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';

@Injectable()
export class ZonePricingQueryService {
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
}
