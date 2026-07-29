import { Inject, Injectable } from '@nestjs/common';

import {
  AuthorizationFacade,
  Authorize,
  ReturnCapabilities,
} from '../../../packages/authorization';
import { ReturnVisibilityScope } from '../../../packages/authorization/decorators/return-visibility-scope.decorator';
import { Policy } from '../../../packages/authorization/policy';
import {
  OrganizationUnitAction,
  OrganizationUnitCapabilityBuilder,
  OrganizationUnitPolicy,
  OrganizationUnitVisibilityScope,
} from '../authorization';
import { OrganizationUnitQueryCriteriaBuilder } from '../builders/query/organization-unit-query-criteria.builder';
import { OrganizationUnitQueryDto } from '../dtos/requests/organization-unit-query.dto';
import { OrganizationUnitDetailsDto } from '../dtos/responses/organization-unit-details.dto';
import { PaginatedOrganizationUnitListDto } from '../dtos/responses/organization-unit-list.dto';
import { OrganizationUnitNotFoundException } from '../exceptions/organization-unit-not-found.exception';
import type { IOrganizationUnitQueryRepository } from '../interfaces/organization-unit.query.repository.interface';
import { IOrganizationUnitQueryService } from '../interfaces/organization-unit.query.service.interface';
import { OrganizationUnitResponseMapper } from '../mappers/response/organization-unit.response.mapper';
import { ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN } from '../tokens/organization-unit-repository.tokens';

@Injectable()
export class OrganizationUnitQueryService implements IOrganizationUnitQueryService {
  constructor(
    @Inject(ORGANIZATION_UNIT_QUERY_REPOSITORY_TOKEN)
    private readonly queryRepository: IOrganizationUnitQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly criteriaBuilder: OrganizationUnitQueryCriteriaBuilder,
    private readonly responseMapper: OrganizationUnitResponseMapper,
  ) {}

  @ReturnVisibilityScope({
    builder: OrganizationUnitVisibilityScope,
  })
  @Authorize({
    policy: Policy(OrganizationUnitPolicy, OrganizationUnitAction.View),
  })
  async findUnits(
    query: OrganizationUnitQueryDto,
  ): Promise<PaginatedOrganizationUnitListDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: OrganizationUnitVisibilityScope,
    });

    const criteria = this.criteriaBuilder.build(query, scope);

    const [items, total] = await this.queryRepository.findMany(criteria);

    return this.responseMapper.toPaginatedListDto(
      items,
      total,
      criteria.pagination,
    );
  }

  @ReturnCapabilities({
    policy: OrganizationUnitCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(OrganizationUnitPolicy, OrganizationUnitAction.View),
    payloadResolver: (unitId: string) => ({ unitId }),
  })
  async getUnitDetails(id: string): Promise<OrganizationUnitDetailsDto> {
    const unit = await this.queryRepository.findByIdWithCoverage(id);

    if (!unit) {
      throw new OrganizationUnitNotFoundException();
    }

    const ancestors = await this.queryRepository.findAncestors(id);

    return this.responseMapper.toDetailsDto(unit, ancestors);
  }
}
