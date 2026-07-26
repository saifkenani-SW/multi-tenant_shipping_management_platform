import { Inject, Injectable } from '@nestjs/common';
import { ITenantQueryService } from '../interfaces/tenant.query.service.interface';
import type { ITenantQueryRepository } from '../interfaces/tenant.query.repository.interface';
import { PaginatedTenantListDto } from '../dtos/responses/tenant-list.dto';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';
import {
  AuthorizationFacade,
  Authorize,
  ReturnCapabilities,
} from '../../../packages/authorization';
import {
  TenantAction,
  TenantCapabilityBuilder,
  TenantPolicy,
  TenantVisibilityScope,
} from '../authorization';
import { TENANT_QUERY_REPOSITORY_TOKEN } from '../tokens/tenant-repository.tokens';
import { ReturnVisibilityScope } from '../../../packages/authorization/decorators/return-visibility-scope.decorator';
import { TenantQueryDto } from '../dtos/requests/tenant-query.dto';
import { Policy } from '../../../packages/authorization/policy';
import { TenantQueryCriteriaBuilder } from '../builders/query/tenant-query-criteria.builder';
import { TenantResponseMapper } from '../mappers/response/tenant.response.mapper';
import { TenantNotFoundException } from '../exceptions/tenant-not-found.exception';

@Injectable()
export class TenantQueryService implements ITenantQueryService {
  constructor(
    @Inject(TENANT_QUERY_REPOSITORY_TOKEN)
    private readonly tenantQueryRepository: ITenantQueryRepository,
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
}
