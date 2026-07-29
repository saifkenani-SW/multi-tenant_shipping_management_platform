export interface CreateRoleRepositoryData {
  readonly tenantId: string;
  readonly name: string;
  readonly description?: string | null;
}

export interface UpdateRoleRepositoryData {
  readonly name?: string;
  readonly description?: string | null;
  readonly isActive?: boolean;
}
