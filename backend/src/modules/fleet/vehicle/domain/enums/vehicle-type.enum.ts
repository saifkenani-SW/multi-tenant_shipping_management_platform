export const VehicleType = {
  BIKE: 'Bike',
  CAR: 'Car',
  VAN: 'Van',
  TRUCK: 'Truck',
} as const;

export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];
