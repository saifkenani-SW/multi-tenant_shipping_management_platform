import { VehicleStatus } from '../enums/vehicle-status.enum';
import { VehicleType } from '../enums/vehicle-type.enum';

export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly plateNumber: string,
    public readonly type: VehicleType | null,
    public readonly capacityKg: number | null,
    public readonly status: VehicleStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * A vehicle may only be dispatched on a trip while it is ACTIVE.
   * Vehicles under maintenance or retired are not operable.
   */
  isOperable(): boolean {
    return this.status === VehicleStatus.ACTIVE;
  }
}
