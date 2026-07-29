import { TenantStatus } from '../enums/tenant-status.enum';

/**
 * Tenant Domain Entity.
 * Represents the business concept of a Tenant.
 * Serves as the single contract between Repositories and Application Services.
 */
export class Tenant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly status: TenantStatus,
    public readonly taxNumber: string | null,
    public readonly email: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly suspendedAt: Date | null = null,
    public readonly suspendedReason: string | null = null,
    public readonly phone: string | null = null,
    public readonly logoUrl: string | null = null,
    public readonly isActive: boolean = status === TenantStatus.ACTIVE,
  ) {}

  /**
   * Example of future business behavior could be placed here:
   *
   * suspend(reason: string) {
   *   if (this.status === TenantStatus.SUSPENDED) throw new Error('Already suspended');
   *   // ...
   * }
   */
}
