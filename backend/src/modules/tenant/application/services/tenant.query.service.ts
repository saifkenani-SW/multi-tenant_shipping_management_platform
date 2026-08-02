import { Inject, Injectable } from '@nestjs/common';
import { TenantQueryRepository } from '../../infrastructure/repositories/tenant.query.repository';

import { PaginatedTenantListDto } from '../dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';
import { TenantSubscriptionDto } from '../dtos/responses/tenant-subscription.dto';
import { TenantSubscriptionHistoryDto } from '../dtos/responses/tenant-subscription-history.dto';
import { TenantSettingsDto } from '../dtos/responses/tenant-settings.dto';
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
    const settingsRecord = await this.tenantQueryRepository.getTenantSettings(tenantId);
    if (!settingsRecord) {
      throw new TenantNotFoundException();
    }
    return this.tenantResponseMapper.toSettingsDto(settingsRecord);
  }

  async isTenantOwner(tenantId: string, userId: string): Promise<boolean> {
    return this.tenantQueryRepository.isTenantOwner(tenantId, userId);
  }
}
