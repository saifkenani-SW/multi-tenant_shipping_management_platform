export class OrganizationUnitChangedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly oldZoneId?: string | null,
    public readonly newZoneId?: string | null,
  ) {}
}
