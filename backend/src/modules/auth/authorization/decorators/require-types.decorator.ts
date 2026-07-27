import { SetMetadata } from '@nestjs/common';
import { UserLoginType } from '../../types/auth.types';

export const REQUIRE_TYPES_KEY = 'requireTypes';
export const RequireTypes = (...types: UserLoginType[]) =>
  SetMetadata(REQUIRE_TYPES_KEY, types);
