export interface TenantCapabilities {
  canUpdate: boolean;
  canDelete: boolean;
  canSuspend?: boolean;
}
