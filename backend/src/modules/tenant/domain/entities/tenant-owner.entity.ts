export class TenantOwner {
  constructor(
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly isPrimary: boolean = true,
    public readonly createdAt: Date = new Date(),
  ) {}
}
