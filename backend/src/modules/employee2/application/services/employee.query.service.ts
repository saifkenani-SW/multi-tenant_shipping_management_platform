import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { EmployeeResponseDto } from '../dtos/responses/employee.response.dto';
import { EmployeeQueryRepository } from '../../infrastructure/repositories/employee.query.repository';
import { EmployeeQueryDto } from '../dtos/requests/employee-query.dto';
import { PaginatedResponse } from '../../../../common/pagination/offset/responses/paginated-response';
import { PaginationMeta } from '../../../../common/pagination/offset/responses/pagination-meta';
import { Pagination } from '../../../../common/pagination/offset/value-objects/pagination';
import { OrganizationFacade } from '../../../organization/facades/organization.facade';
import { AuthorizationModuleFacade } from '../../../authorization/facades/authorization-module.facade';

@Injectable()
export class EmployeeQueryService {
  constructor(
    private readonly queryRepository: EmployeeQueryRepository,
    private readonly organizationFacade: OrganizationFacade,
    private readonly authorizationFacade: AuthorizationModuleFacade,
  ) {}

  async findById(id: string, tenantId?: string) {
    const employee = await this.queryRepository.findById(id);
    if (!employee || (tenantId && employee.tenantId !== tenantId)) {
      throw new NotFoundException('الموظف غير موجود');
    }

    const orgUnitIds = employee.rawAssignments.map((a) => a.organizationUnitId);
    const roleIds = employee.rawAssignments.flatMap((a) => a.roleIds);

    const [orgUnits, roles] = await Promise.all([
      this.organizationFacade.getOrganizationUnitsByIds(orgUnitIds),
      this.authorizationFacade.getRolesWithPermissions(roleIds),
    ]);

    const orgUnitMap = new Map(orgUnits.map((u) => [u.id, u]));
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    const assignments = employee.rawAssignments.map((assignment) => {
      const orgUnit = orgUnitMap.get(assignment.organizationUnitId);
      return {
        id: assignment.assignmentId,
        organizationUnitId: assignment.organizationUnitId,
        organizationUnitName: orgUnit?.name || 'Unknown',
        organizationUnitType: orgUnit?.orgType || 'Unknown',
        roles: assignment.roleIds.map((rId) => {
          const role = roleMap.get(rId);
          return {
            id: rId,
            name: role?.name || 'Unknown',
          };
        }),
      };
    });

    const { rawAssignments, ...employeeData } = employee;

    return plainToInstance(
      EmployeeResponseDto,
      {
        ...employeeData,
        assignments,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findMany(query: EmployeeQueryDto, contextTenantId?: string) {
    const pagination = new Pagination({
      page: query.page || 1,
      limit: query.limit || 10,
    });

    const effectiveTenantId = contextTenantId || query.tenantId;
    const items = await this.queryRepository.findMany(
      pagination.take,
      pagination.skip,
      query.search,
      effectiveTenantId,
      query.organizationUnitId,
    );
    const total = await this.queryRepository.countByTenantId(
      effectiveTenantId,
      query.search,
      query.organizationUnitId,
    );

    return new PaginatedResponse(
      plainToInstance(EmployeeResponseDto, items, {
        excludeExtraneousValues: true,
      }),
      new PaginationMeta(pagination, total),
    );
  }

  async countByTenantId(
    tenantId?: string,
    search?: string,
    organizationUnitId?: string,
  ) {
    return this.queryRepository.countByTenantId(
      tenantId,
      search,
      organizationUnitId,
    );
  }

  async findBasicDetailsByIds(ids: string[]) {
    return this.queryRepository.findBasicDetailsByIds(ids);
  }

  /**
   * Returns true when the employee has an active assignment to the given
   * organization unit. Used by manifest services for scope enforcement.
   */
  async isAssignedToOrgUnit(
    employeeId: string,
    orgUnitId: string,
  ): Promise<boolean> {
    return this.queryRepository.isAssignedToOrgUnit(employeeId, orgUnitId);
  }
}
