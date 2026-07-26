import { Injectable } from '@nestjs/common';
import { TenantQueryDto } from '../../dtos/requests/tenant-query.dto';
import { TenantSearchField } from '../../enums/tenant-search-field.enum';
import {
  TenantQueryCriteria,
  TenantQueryCriteriaSearch,
} from './tenant-query-criteria';
import { TenantScopeInterface } from '../../authorization';
import { OffsetPaginationBuilder } from '../../../../common/pagination';

@Injectable()
export class TenantQueryCriteriaBuilder {
  build(
    query: TenantQueryDto,
    scope: TenantScopeInterface,
  ): TenantQueryCriteria {
    return new TenantQueryCriteria({
      pagination: OffsetPaginationBuilder.build(query),
      search: this.buildSearchCriteria(query),
      tenantId: scope.tenantId,
    });
  }

  private buildSearchCriteria(
    query: TenantQueryDto,
  ): TenantQueryCriteriaSearch | undefined {
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
