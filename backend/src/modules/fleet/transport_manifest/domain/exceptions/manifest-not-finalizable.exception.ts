import { BadRequestException } from '@nestjs/common';

/** Thrown when trying to finalize a manifest that is not in OPEN status, or has no items. */
export class ManifestNotFinalizableException extends BadRequestException {
  constructor(reason = 'Manifest cannot be finalised') {
    super(reason);
  }
}
