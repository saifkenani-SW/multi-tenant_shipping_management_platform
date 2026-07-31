import { BadRequestException } from '@nestjs/common';

export class InvalidTenantFilterException extends BadRequestException {
  constructor(message = 'Invalid tenant filter') {
    super(message);
  }
}
