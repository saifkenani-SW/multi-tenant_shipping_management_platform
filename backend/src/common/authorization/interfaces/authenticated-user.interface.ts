export type UserRole =
  string | { id?: string; name?: string; code?: string; slug?: string };
export type UserPermission =
  string | { id?: string; name?: string; code?: string; slug?: string };

export interface AuthenticatedUser {
  id: string;
  roles?: UserRole[];
  permissions?: UserPermission[];
  [key: string]: any;
}
