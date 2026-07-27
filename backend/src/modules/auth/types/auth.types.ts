export enum UserLoginType {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

export enum ClientType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export interface JwtPayload {
  sub: string; // user_id
  sessionId: string; // user_session ID
  type: UserLoginType;
  tenantId?: string; // REQUIRED only if type is EMPLOYEE
  iat?: number;
  exp?: number;
}
