import { ConflictException } from '@nestjs/common';

export class InvalidManifestItemTransitionException extends ConflictException {
  constructor(from: string, to: string) {
    super(`Manifest item cannot move from ${from} to ${to}`);
  }
}
