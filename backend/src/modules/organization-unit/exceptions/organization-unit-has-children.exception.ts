import { ConflictException } from '@nestjs/common';

export class OrganizationUnitHasChildrenException extends ConflictException {
  constructor(childCount: number) {
    super(
      `Unit still has ${childCount} child unit(s). Move or delete them first.`,
    );
  }
}
