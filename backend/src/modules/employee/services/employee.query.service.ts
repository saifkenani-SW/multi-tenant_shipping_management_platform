import { Inject, Injectable } from '@nestjs/common';

import {
  AuthorizationFacade, // From packages/authorization
  Authorize,
  ReturnCapabilities,
} from '../../../packages/authorization';
import { AuthorizationModuleFacade } from '../../authorization/facades/authorization-module.facade';
import { Principal } from '../../../packages/context/principal/principal/Principal';
import { ScopeAccess } from '../../../packages/context/principal/principal/ScopeAccess';
import { Subject } from '../../../packages/context/principal/principal/Subject';
import { SubjectType } from '../../../packages/context/principal/principal/SubjectType';
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
    private readonly authorizationModuleFacade: AuthorizationModuleFacade,
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

  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.View),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  async findById(id: string) {
    const employee = await this.queryRepository.findById(id);

    if (!employee) {
      throw new EmployeeNotFoundException();
    }

    return employee;
  }

  @ReturnCapabilities({
    policy: EmployeeCapabilityBuilder,
  })
  @Authorize({
    policy: Policy(EmployeePolicy, EmployeeAction.View),
    payloadResolver: (employeeId: string) => ({ employeeId }),
  })
  async findDetailsById(id: string): Promise<EmployeeDetailsDto> {
    // Ensures access verification happens through findById if called from another module or internally
    // though the controller calls this directly which triggers the Authorize interceptor.
    await this.findById(id);

    const employee = await this.queryRepository.findByIdWithAssignments(id);

    if (!employee) {
      throw new EmployeeNotFoundException();
    }

    return this.responseMapper.toDetailsDto(employee);
  }

  async getPrincipalByUserId(
    userId: string,
    tenantId: string,
  ): Promise<Partial<Principal> | null> {
    const scopeAssignments =
      await this.queryRepository.getEmployeeAssignmentsWithRoles(
        userId,
        tenantId,
      );

    if (!scopeAssignments || scopeAssignments.length === 0) {
      return null;
    }

    const roleIds = Array.from(new Set(scopeAssignments.map((a) => a.roleId)));

    const accessRoles =
      await this.authorizationModuleFacade.getRolesWithPermissions(roleIds);

    const accessRolesMap = new Map(accessRoles.map((r) => [r.id, r]));

    const branches: ScopeAccess[] = [];
    const warehouses: ScopeAccess[] = [];

    for (const assignment of scopeAssignments) {
      const accessRole = accessRolesMap.get(assignment.roleId);
      if (!accessRole) continue;

      const scopeAccess: ScopeAccess = {
        id: assignment.scopeId,
        role: accessRole,
      };

      if (assignment.orgType === 'BRANCH') {
        branches.push(scopeAccess);
      } else if (assignment.orgType === 'WAREHOUSE') {
        warehouses.push(scopeAccess);
      }
    }

    return {
      subject: {
        id: userId,
        type: SubjectType.EMPLOYEE,
      } as Subject,
      tenantId: tenantId,
      branches,
      warehouses,
    };
  }
}
