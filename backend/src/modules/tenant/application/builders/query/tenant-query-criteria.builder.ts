import { Injectable } from '@nestjs/common';
import { TenantQueryDto } from '../../dtos/requests/tenant-query.dto';
import { TenantSearchField } from '../../../domain/enums/tenant-search-field.enum';
import { TenantQueryCriteria } from './tenant-query-criteria';
import { TenantScopeInterface } from '../../../domain/authorization';
import { OffsetPaginationBuilder } from '../../../../../common/pagination';

@Injectable()
export class TenantQueryCriteriaBuilder {
  build(
    query: TenantQueryDto,
    scope: TenantScopeInterface,
  ): TenantQueryCriteria {
    return {
      pagination: OffsetPaginationBuilder.build(query),
      search: this.buildSearchCriteria(query),
      tenantId: scope.tenantId,
    };
  }

  private buildSearchCriteria(
    query: TenantQueryDto,
  ): TenantQueryCriteria['search'] {
    if (!query.search) {
      return undefined;
    }

    const field = query.searchType ?? TenantSearchField.NAME;

    return {
      keyword: query.search,
      field,
    };
  }
}
