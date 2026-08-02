import { Permission } from './permission.entity';

/**
 * Role Domain Entity.
 *
 * Represents an authorization role assigned to users within a tenant scope.
 */
export class Role {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly permissions: readonly Permission[] = [],
  ) {}
}
