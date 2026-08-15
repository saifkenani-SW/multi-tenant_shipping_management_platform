import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantQueryRepository } from '../../infrastructure/repositories/tenant.query.repository';
import {
  UserFacade,
  UserSummaryDto,
} from '../../../user/application/facades/user.facade';

import { PaginatedTenantListDto } from '../dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';
import { TenantSubscriptionDto } from '../dtos/responses/tenant-subscription.dto';
import { TenantSubscriptionHistoryDto } from '../dtos/responses/tenant-subscription-history.dto';
import {
  TenantPricingSettingsOnlyDto,
  TenantSettingsDto,
} from '../dtos/responses/tenant-settings.dto';
import {
  AuthorizationFacade,
  Authorize,
  ReturnCapabilities,
} from '../../../../packages/authorization';
import {
  TenantAction,
  TenantCapabilityBuilder,
  TenantPolicy,
  TenantVisibilityScope,
} from '../../domain/authorization';

import { ReturnVisibilityScope } from '../../../../packages/authorization/decorators/return-visibility-scope.decorator';
import { TenantQueryDto } from '../dtos/requests/tenant-query.dto';
import { Policy } from '../../../../packages/authorization/policy';
import { TenantQueryCriteriaBuilder } from '../builders/query/tenant-query-criteria.builder';
import { TenantResponseMapper } from '../mappers/tenant.response.mapper';
import { TenantNotFoundException } from '../../domain/exceptions/tenant-not-found.exception';

@Injectable()
export class TenantQueryService {
  constructor(
    private readonly tenantQueryRepository: TenantQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly tenantQueryCriteriaBuilder: TenantQueryCriteriaBuilder,
    private readonly tenantResponseMapper: TenantResponseMapper,
    private readonly userFacade: UserFacade,
  ) {}

  @ReturnVisibilityScope({
    builder: TenantVisibilityScope,
  })
  async findTenants(query: TenantQueryDto): Promise<PaginatedTenantListDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: TenantVisibilityScope,
    });

    const criteria = this.tenantQueryCriteriaBuilder.build(query, scope);

    const [items, total] = await this.tenantQueryRepository.findMany(criteria);

    return this.tenantResponseMapper.toPaginatedListDto(
      items,
      total,
      criteria.pagination,
    );
  }
  @ReturnCapabilities({
    policy: TenantCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.View),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async getTenantDetails(id: string): Promise<TenantDetailsDto> {
    const tenant = await this.tenantQueryRepository.findById(id);

    if (!tenant) {
      throw new TenantNotFoundException();
    }

    return this.tenantResponseMapper.toDetailsDto(tenant);
  }

  // Used internally by other services/facades, does not need @Authorize
  async findByIds(
    ids: string[],
    activeOnly: boolean = false,
  ): Promise<TenantDetailsDto[]> {
    if (!ids || ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const result = await this.tenantQueryRepository.findByIds(uniqueIds);
    const records =
      result instanceof Map ? Array.from(result.values()) : result;

    let dtos = records.map((t: any) =>
      this.tenantResponseMapper.toDetailsDto(t),
    );

    if (activeOnly) {
      dtos = dtos.filter((d) => d.status === 'ACTIVE');
    }

    return dtos;
  }

  @ReturnCapabilities({
    policy: TenantCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.View),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async getTenantSubscription(
    tenantId: string,
  ): Promise<TenantSubscriptionDto | null> {
    const subscription =
      await this.tenantQueryRepository.findActiveSubscription(tenantId);
    if (!subscription) return null;
    return this.tenantResponseMapper.toSubscriptionDto(subscription);
  }

  @ReturnCapabilities({
    policy: TenantCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.View),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async getTenantSubscriptionHistory(
    tenantId: string,
  ): Promise<TenantSubscriptionHistoryDto[]> {
    const history =
      await this.tenantQueryRepository.findSubscriptionHistory(tenantId);
    return history.map((h) =>
      this.tenantResponseMapper.toSubscriptionHistoryDto(h),
    );
  }
  @ReturnCapabilities({
    policy: TenantCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.View),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async getTenantSettings(tenantId: string): Promise<TenantSettingsDto> {
    const settingsRecord =
      await this.tenantQueryRepository.getTenantSettings(tenantId);
    if (!settingsRecord) {
      throw new TenantNotFoundException();
    }
    return this.tenantResponseMapper.toSettingsDto(settingsRecord);
  }

  // Not exposed via API directly (used internally by Facade/Services), so no @Authorize needed here
  // as it is called in a trusted context like QuotationGenerationService.
  async getTenantPricingSettingsBatch(
    tenantIds: string[],
  ): Promise<TenantPricingSettingsOnlyDto[]> {
    if (!tenantIds || tenantIds.length === 0) return [];

    const result =
      await this.tenantQueryRepository.getTenantPricingSettingsBatch(tenantIds);
    const settingsRecords =
      result instanceof Map ? Array.from(result.values()) : result;
    return settingsRecords.map((r: any) =>
      this.tenantResponseMapper.toPricingSettingsDto(r),
    );
  }

  async isTenantOwner(tenantId: string, userId: string): Promise<boolean> {
    return this.tenantQueryRepository.isTenantOwner(tenantId, userId);
  }

  @Authorize({
    policy: Policy(TenantPolicy, TenantAction.View),
    payloadResolver: (tenantId: string) => ({
      tenantId,
    }),
  })
  async getTenantOwner(tenantId: string): Promise<UserSummaryDto> {
    const ownerId = await this.tenantQueryRepository.getTenantOwnerId(tenantId);
    if (!ownerId) {
      throw new NotFoundException('Tenant owner not found');
    }

    const userSummary = await this.userFacade.getUserSummary(ownerId);
    if (!userSummary) {
      throw new NotFoundException('User details not found');
    }
    return userSummary;
  }
}
