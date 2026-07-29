import { Injectable } from '@nestjs/common';

import { Pagination, PaginationMeta } from '../../../../common/pagination';
import { EmployeeAssignment } from '../../domain/employee-assignment.entity';
import { Employee } from '../../domain/employee.entity';
import { EmployeeAssignmentDto } from '../../dtos/responses/employee-assignment.dto';
import { EmployeeDetailsDto } from '../../dtos/responses/employee-details.dto';
import {
  EmployeeListDto,
  PaginatedEmployeeListDto,
} from '../../dtos/responses/employee-list.dto';

@Injectable()
export class EmployeeResponseMapper {
  toListDto(employee: Employee): EmployeeListDto {
    const dto = new EmployeeListDto();
    dto.id = employee.id;
    dto.employeeCode = employee.employeeCode;
    dto.fullName = employee.fullName;
    dto.email = employee.email;
    dto.isActive = employee.isActive;
    return dto;
  }

  toAssignmentDto(assignment: EmployeeAssignment): EmployeeAssignmentDto {
    const dto = new EmployeeAssignmentDto();
    dto.id = assignment.id;
    dto.organizationUnitId = assignment.organizationUnitId;
    dto.organizationUnitName = assignment.organizationUnitName;
    dto.isActive = assignment.isActive;
    dto.roleIds = [...assignment.roleIds];
    dto.createdAt = assignment.createdAt;
    return dto;
  }

  toDetailsDto(employee: Employee): EmployeeDetailsDto {
    const dto = new EmployeeDetailsDto();
    dto.id = employee.id;
    dto.tenantId = employee.tenantId;
    dto.userId = employee.userId;
    dto.employeeCode = employee.employeeCode;
    dto.fullName = employee.fullName;
    dto.nationalId = employee.nationalId;
    dto.email = employee.email;
    dto.phone = employee.phone;
    dto.isActive = employee.isActive;
    dto.deactivatedAt = employee.deactivatedAt;
    dto.createdAt = employee.createdAt;
    dto.updatedAt = employee.updatedAt;
    dto.assignments = employee.assignments.map((assignment) =>
      this.toAssignmentDto(assignment),
    );
    return dto;
  }

  toPaginatedListDto(
    employees: Employee[],
    total: number,
    pagination: Pagination,
  ): PaginatedEmployeeListDto {
    const dto = new PaginatedEmployeeListDto();
    dto.data = employees.map((employee) => this.toListDto(employee));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }
}
