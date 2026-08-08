import { BadRequestException } from '@nestjs/common';

export class InvalidManifestRouteException extends BadRequestException {
  constructor() {
    super(
      'Manifest origin and destination must be two different organization units',
    );
  }
}
