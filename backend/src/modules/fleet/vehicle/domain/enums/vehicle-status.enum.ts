export const VehicleStatus = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const;

export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];
