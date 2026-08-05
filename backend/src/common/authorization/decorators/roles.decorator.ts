import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ROLES_KEY } from '../constants/authorization.constants';
import { RolesGuard } from '../guards/roles.guard';

export const Roles = (...roles: string[]) => {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(RolesGuard),
  );
};
