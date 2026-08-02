import { BadRequestException } from '@nestjs/common';

export class UnknownPermissionException extends BadRequestException {
  constructor(missingIds: readonly string[]) {
    super(
      `The following permission IDs are unknown in the catalog: ${missingIds.join(', ')}`,
    );
  }
}
