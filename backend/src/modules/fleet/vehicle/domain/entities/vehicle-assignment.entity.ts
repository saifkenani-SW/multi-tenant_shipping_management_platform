export class VehicleAssignment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly employeeId: string,
    public readonly vehicleId: string,
    public readonly isActive: boolean,
    public readonly assignedAt: Date,
    public readonly removedAt: Date | null,
  ) {}

  isCurrentlyAssigned(): boolean {
    return this.isActive && this.removedAt === null;
  }
}
