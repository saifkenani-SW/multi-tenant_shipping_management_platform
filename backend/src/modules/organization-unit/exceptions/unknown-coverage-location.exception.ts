import { BadRequestException } from '@nestjs/common';

export class UnknownCoverageLocationException extends BadRequestException {
  constructor(locationIds: readonly string[]) {
    super(`Unknown global location id(s): ${locationIds.join(', ')}`);
  }
}
