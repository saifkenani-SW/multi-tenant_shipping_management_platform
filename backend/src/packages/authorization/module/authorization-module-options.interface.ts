import { Type } from '@nestjs/common';
import { AuthorizationContextProvider } from '../contracts';

export interface AuthorizationModuleOptions {
  readonly contextProvider: Type<AuthorizationContextProvider>;
}
