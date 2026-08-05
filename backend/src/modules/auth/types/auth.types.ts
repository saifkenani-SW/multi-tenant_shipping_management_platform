export enum UserLoginType {
  CUSTOMER = 'CUSTOMER',
  EMPLOYEE = 'EMPLOYEE',
  PLATFORM_OWNER = 'PLATFORM_OWNER',
  TENANT_ADMIN = 'TENANT_ADMIN',
  DRIVER = 'DRIVER',
}

export enum ClientType {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

export interface JwtPayload {
  sub: string; // user_id
  sessionId: string; // user_session ID
  type: UserLoginType;
  tenantId?: string; // REQUIRED only if type is EMPLOYEE, TENANT_ADMIN, or DRIVER
  profileId?: string;
  vehicleId?: string;
  iat?: number;
  exp?: number;
}
