import { Injectable } from '@nestjs/common';

import { OffsetPaginationBuilder } from '../../../../common/pagination';
import { GlobalLocationQueryDto } from '../../dtos/requests/global-location-query.dto';
import { GlobalLocationSearchField } from '../../enums/global-location-search-field.enum';
import {
  GlobalLocationQueryCriteria,
  GlobalLocationQueryCriteriaSearch,
} from './global-location-query-criteria';

@Injectable()
export class GlobalLocationQueryCriteriaBuilder {
  build(query: GlobalLocationQueryDto): GlobalLocationQueryCriteria {
    return new GlobalLocationQueryCriteria({
      pagination: OffsetPaginationBuilder.build(query),
      search: this.buildSearchCriteria(query),
      type: query.type,
      parentId: this.resolveParentId(query),
    });
  }

  /**
   * rootsOnly=true تعني parent_id IS NULL، وهي مختلفة عن عدم التصفية.
   * لذلك نميّز null عن undefined بدل استخدام قيمة واحدة للحالتين.
   */
  private resolveParentId(
    query: GlobalLocationQueryDto,
  ): string | null | undefined {
    if (query.parentId) {
      return query.parentId;
    }

    return query.rootsOnly ? null : undefined;
  }

  private buildSearchCriteria(
    query: GlobalLocationQueryDto,
  ): GlobalLocationQueryCriteriaSearch | undefined {
    if (!query.search) {
      return undefined;
    }

    return {
      keyword: query.search,
      field: query.searchType ?? GlobalLocationSearchField.NAME,
    };
  }
}
