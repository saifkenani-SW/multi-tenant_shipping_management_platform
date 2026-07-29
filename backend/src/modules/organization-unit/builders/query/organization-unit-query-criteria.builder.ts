import { Injectable } from '@nestjs/common';

import { OffsetPaginationBuilder } from '../../../../common/pagination';
import { OrganizationUnitScopeInterface } from '../../authorization/scopes/organization-unit-scope.interface';
import { OrganizationUnitQueryDto } from '../../dtos/requests/organization-unit-query.dto';
import { OrganizationUnitSearchField } from '../../enums/organization-unit-search-field.enum';
import {
  OrganizationUnitQueryCriteria,
  OrganizationUnitQueryCriteriaSearch,
} from './organization-unit-query-criteria';

@Injectable()
export class OrganizationUnitQueryCriteriaBuilder {
  build(
    query: OrganizationUnitQueryDto,
    scope: OrganizationUnitScopeInterface,
  ): OrganizationUnitQueryCriteria {
    return new OrganizationUnitQueryCriteria({
      pagination: OffsetPaginationBuilder.build(query),
      search: this.buildSearchCriteria(query),
      orgType: query.orgType,
      isActive: query.isActive,
      zoneId: query.zoneId,
      parentId: this.resolveParentId(query),
      tenantId: scope.tenantId,
    });
  }

  private resolveParentId(
    query: OrganizationUnitQueryDto,
  ): string | null | undefined {
    if (query.parentId) {
      return query.parentId;
    }

    return query.rootsOnly ? null : undefined;
  }

  private buildSearchCriteria(
    query: OrganizationUnitQueryDto,
  ): OrganizationUnitQueryCriteriaSearch | undefined {
    if (!query.search) {
      return undefined;
    }

    return {
      keyword: query.search,
      field: query.searchType ?? OrganizationUnitSearchField.NAME,
    };
  }
}
