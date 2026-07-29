import { Injectable } from '@nestjs/common';

import { EmployeeAssignment } from '../../domain/employee-assignment.entity';
import { Employee } from '../../domain/employee.entity';

export interface EmployeePersistenceRecord {
  readonly id: string;
  readonly tenant_id: string;
  readonly user_id: string;
  readonly employee_code: string;
  readonly full_name: string;
  readonly national_id: string | null;
  readonly is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly deactivated_at: Date | null;
  readonly email?: string | null;
  readonly phone?: string | null;
}

export interface AssignmentPersistenceRecord {
  readonly id: string;
  readonly employee_id: string;
  readonly organization_unit_id: string;
  readonly is_active: boolean;
  readonly created_at: Date;
  readonly organization_unit_name?: string | null;
}

@Injectable()
export class EmployeePersistenceMapper {
  toDomain(
    record: EmployeePersistenceRecord,
    assignments: readonly EmployeeAssignment[] = [],
  ): Employee {
    return new Employee(
      record.id,
      record.tenant_id,
      record.user_id,
      record.employee_code,
      record.full_name,
      record.national_id,
      record.is_active,
      record.created_at,
      record.updated_at,
      record.deactivated_at,
      record.email ?? null,
      record.phone ?? null,
      assignments,
    );
  }

  toAssignmentDomain(
    record: AssignmentPersistenceRecord,
    roleIds: readonly string[] = [],
  ): EmployeeAssignment {
    return new EmployeeAssignment(
      record.id,
      record.employee_id,
      record.organization_unit_id,
      record.is_active,
      record.created_at,
      roleIds,
      record.organization_unit_name ?? null,
    );
  }
}
