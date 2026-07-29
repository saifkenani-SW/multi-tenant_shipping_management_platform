import { Injectable } from '@nestjs/common';

import { OffsetPaginationBuilder } from '../../../../common/pagination';
import { EmployeeScopeInterface } from '../../authorization/scopes/employee-scope.interface';
import { EmployeeQueryDto } from '../../dtos/requests/employee-query.dto';
import { EmployeeSearchField } from '../../enums/employee-search-field.enum';
import {
  EmployeeQueryCriteria,
  EmployeeQueryCriteriaSearch,
} from './employee-query-criteria';

@Injectable()
export class EmployeeQueryCriteriaBuilder {
  build(
    query: EmployeeQueryDto,
    scope: EmployeeScopeInterface,
  ): EmployeeQueryCriteria {
    return new EmployeeQueryCriteria({
      pagination: OffsetPaginationBuilder.build(query),
      search: this.buildSearchCriteria(query),
      isActive: query.isActive,
      organizationUnitId: query.organizationUnitId,
      tenantId: scope.tenantId,
    });
  }

  private buildSearchCriteria(
    query: EmployeeQueryDto,
  ): EmployeeQueryCriteriaSearch | undefined {
    if (!query.search) {
      return undefined;
    }

    return {
      keyword: query.search,
      field: query.searchType ?? EmployeeSearchField.FULL_NAME,
    };
  }
}
