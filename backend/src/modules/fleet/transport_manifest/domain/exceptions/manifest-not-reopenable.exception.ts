import { ConflictException } from '@nestjs/common';

/** Thrown when trying to reopen a manifest that is not in READY_FOR_DISPATCH, or is already linked to a trip. */
export class ManifestNotReopenableException extends ConflictException {
  constructor() {
    super('Manifest cannot be reopened: it is either not in READY_FOR_DISPATCH status or is already linked to a trip');
  }
}
