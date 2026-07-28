import { Inject, Injectable } from '@nestjs/common';

import { Authorize, ReturnCapabilities } from '../../../packages/authorization';
import { ReturnVisibilityScope } from '../../../packages/authorization/decorators/return-visibility-scope.decorator';
import { Policy } from '../../../packages/authorization/policy';
import {
  GlobalLocationAction,
  GlobalLocationCapabilityBuilder,
  GlobalLocationPolicy,
  GlobalLocationVisibilityScope,
} from '../authorization';
import { GlobalLocationQueryCriteriaBuilder } from '../builders/query/global-location-query-criteria.builder';
import { GlobalLocationQueryDto } from '../dtos/requests/global-location-query.dto';
import { GlobalLocationDetailsDto } from '../dtos/responses/global-location-details.dto';
import { PaginatedGlobalLocationListDto } from '../dtos/responses/global-location-list.dto';
import { GlobalLocationNotFoundException } from '../exceptions/global-location-not-found.exception';
import { IGlobalLocationQueryService } from '../interfaces/global-location.query.service.interface';
import type { IGlobalLocationQueryRepository } from '../interfaces/global-location.query.repository.interface';
import { GlobalLocationResponseMapper } from '../mappers/response/global-location.response.mapper';
import { GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN } from '../tokens/global-location-repository.tokens';

@Injectable()
export class GlobalLocationQueryService implements IGlobalLocationQueryService {
  constructor(
    @Inject(GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN)
    private readonly queryRepository: IGlobalLocationQueryRepository,
    private readonly criteriaBuilder: GlobalLocationQueryCriteriaBuilder,
    private readonly responseMapper: GlobalLocationResponseMapper,
  ) {}

  @ReturnVisibilityScope({
    builder: GlobalLocationVisibilityScope,
  })
  @Authorize({
    policy: Policy(GlobalLocationPolicy, GlobalLocationAction.View),
  })
  async findLocations(
    query: GlobalLocationQueryDto,
  ): Promise<PaginatedGlobalLocationListDto> {
    const criteria = this.criteriaBuilder.build(query);

    const [items, total] = await this.queryRepository.findMany(criteria);

    return this.responseMapper.toPaginatedListDto(
      items,
      total,
      criteria.pagination,
    );
  }

  @ReturnCapabilities({
    policy: GlobalLocationCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(GlobalLocationPolicy, GlobalLocationAction.View),
    payloadResolver: (locationId: string) => ({ locationId }),
  })
  async getLocationDetails(id: string): Promise<GlobalLocationDetailsDto> {
    const location = await this.queryRepository.findById(id);

    if (!location) {
      throw new GlobalLocationNotFoundException();
    }

    // سلسلة الآباء تُعرض في مسار التنقّل (breadcrumb) بالواجهة.
    const ancestors = await this.queryRepository.findAncestors(id);

    return this.responseMapper.toDetailsDto(location, ancestors);
  }
}
