import { ForbiddenException } from '@nestjs/common';

export class AccessDeniedException extends ForbiddenException {
  constructor(message = 'Access denied') {
    super(message);
  }
}
