import { Injectable } from '@nestjs/common';

import { OffsetPaginationBuilder } from '../../../../common/pagination';
import { PermissionQueryDto } from '../../dtos/requests/permission-query.dto';
import { PermissionSearchField } from '../../enums/permission-search-field.enum';
import {
  PermissionQueryCriteria,
  PermissionQueryCriteriaSearch,
} from './permission-query-criteria';

@Injectable()
export class PermissionQueryCriteriaBuilder {
  build(query: PermissionQueryDto): PermissionQueryCriteria {
    return new PermissionQueryCriteria({
      pagination: OffsetPaginationBuilder.build(query),
      search: this.buildSearchCriteria(query),
      resource: query.resource,
    });
  }

  private buildSearchCriteria(
    query: PermissionQueryDto,
  ): PermissionQueryCriteriaSearch | undefined {
    if (!query.search) {
      return undefined;
    }

    return {
      keyword: query.search,
      field: query.searchType ?? PermissionSearchField.NAME,
    };
  }
}
