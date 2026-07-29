export interface CreateEmployeeUserData {
  readonly email: string;
  readonly phone: string | null;
  readonly passwordHash: string;
}

export interface CreateEmployeeRepositoryData {
  readonly tenantId: string;
  readonly userId: string;
  readonly employeeCode: string;
  readonly fullName: string;
  readonly nationalId: string | null;
}

export interface UpdateEmployeeRepositoryData {
  readonly fullName?: string;
  readonly nationalId?: string | null;
  readonly employeeCode?: string;
}

export interface CreateAssignmentRepositoryData {
  readonly tenantId: string;
  readonly employeeId: string;
  readonly organizationUnitId: string;
  readonly roleIds: readonly string[];
}
