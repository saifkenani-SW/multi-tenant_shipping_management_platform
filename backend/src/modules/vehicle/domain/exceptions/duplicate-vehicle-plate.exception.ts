import { ConflictException } from '@nestjs/common';

export class DuplicateVehiclePlateException extends ConflictException {
  constructor(plateNumber: string) {
    super(
      `Vehicle plate number "${plateNumber}" is already used in this tenant`,
    );
  }
}
