import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClientType } from '../types/auth.types';

export const GetClientType = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientType => {
    const request = ctx.switchToHttp().getRequest();
    const clientType =
      request.headers['client-type'] || request.body?.clientType;
    return clientType === ClientType.MOBILE
      ? ClientType.MOBILE
      : ClientType.WEB;
  },
);
