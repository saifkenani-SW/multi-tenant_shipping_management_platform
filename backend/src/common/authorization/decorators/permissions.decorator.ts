import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../constants/authorization.constants';
import { PermissionsGuard } from '../../../modules/auth/authorization/guards/permissions.guard';

/**
 * Declares the permission required to access a route.
 *
 * Usage:
 *   @Permissions(PermissionAction.CREATE, PermissionResource.MANIFEST)
 *   // → checks for the permission named 'CREATE_MANIFEST' in the employee's roles
 *
 * The args are joined with '_' so that @Permissions('CREATE', 'MANIFEST') and
 * @Permissions('CREATE_MANIFEST') are both valid and equivalent.
 */
export const Permissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, [permissions.join('_')]),
    UseGuards(PermissionsGuard),
  );
