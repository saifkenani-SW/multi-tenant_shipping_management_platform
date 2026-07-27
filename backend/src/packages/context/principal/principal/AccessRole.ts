import { Permission } from '../../../../core/security/Permission';
export interface AccessRole {
  id: string;

  name: string;

  permissions: Permission[];
}
