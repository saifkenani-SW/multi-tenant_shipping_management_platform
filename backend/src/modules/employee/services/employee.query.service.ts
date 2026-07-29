import { Inject, Injectable } from '@nestjs/common';

import {
  AuthorizationFacade,
  Authorize,
  ReturnCapabilities,
} from '../../../packages/authorization';
import { ReturnVisibilityScope } from '../../../packages/authorization/decorators/return-visibility-scope.decorator';
import { Policy } from '../../../packages/authorization/policy';
import {
  EmployeeAction,
  EmployeeCapabilityBuilder,
  EmployeePolicy,
  EmployeeVisibilityScope,
} from '../authorization';
import { EmployeeQueryCriteriaBuilder } from '../builders/query/employee-query-criteria.builder';
import { EmployeeQueryDto } from '../dtos/requests/employee-query.dto';
import { EmployeeDetailsDto } from '../dtos/responses/employee-details.dto';
import { PaginatedEmployeeListDto } from '../dtos/responses/employee-list.dto';
import { EmployeeNotFoundException } from '../exceptions/employee-not-found.exception';
import type { IEmployeeQueryRepository } from '../interfaces/employee.query.repository.interface';
import { IEmployeeQueryService } from '../interfaces/employee.query.service.interface';
import { EmployeeResponseMapper } from '../mappers/response/employee.response.mapper';
import { EMPLOYEE_QUERY_REPOSITORY_TOKEN } from '../tokens/employee-repository.tokens';

@Injectable()
export class EmployeeQueryService implements IEmployeeQueryService {
  constructor(
    @Inject(EMPLOYEE_QUERY_REPOSITORY_TOKEN)
    private readonly queryRepository: IEmployeeQueryRepository,
    private readonly authorizationFacade: AuthorizationFacade,
    private readonly criteriaBuilder: EmployeeQueryCriteriaBuilder,
    private readonly responseMapper: EmployeeResponseMapper,
  ) {}

  @ReturnVisibilityScope({
    builder: EmployeeVisibilityScope,
  })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.View),
  })
  async findEmployees(
    query: EmployeeQueryDto,
  ): Promise<PaginatedEmployeeListDto> {
    const scope = this.authorizationFacade.buildScope({
      builder: EmployeeVisibilityScope,
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
    policy: EmployeeCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.View),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  async getEmployeeDetails(id: string): Promise<EmployeeDetailsDto> {
    const employee = await this.queryRepository.findByIdWithAssignments(id);

    if (!employee) {
      throw new EmployeeNotFoundException();
    }

    return this.responseMapper.toDetailsDto(employee);
  }
}
