import { Injectable } from '@nestjs/common';

import { OffsetPaginationBuilder } from '../../../../common/pagination';
import { RoleScopeInterface } from '../../authorization/scopes/role-scope.interface';
import { RoleQueryDto } from '../../dtos/requests/role-query.dto';
import { RoleSearchField } from '../../enums/role-search-field.enum';
import {
  RoleQueryCriteria,
  RoleQueryCriteriaSearch,
} from './role-query-criteria';

@Injectable()
export class RoleQueryCriteriaBuilder {
  build(query: RoleQueryDto, scope: RoleScopeInterface): RoleQueryCriteria {
    return new RoleQueryCriteria({
      pagination: OffsetPaginationBuilder.build(query),
      search: this.buildSearchCriteria(query),
      isActive: query.isActive,
      tenantId: scope.tenantId,
    });
  }

  private buildSearchCriteria(
    query: RoleQueryDto,
  ): RoleQueryCriteriaSearch | undefined {
    if (!query.search) {
      return undefined;
    }

    return {
      keyword: query.search,
      field: query.searchType ?? RoleSearchField.NAME,
    };
  }
}
