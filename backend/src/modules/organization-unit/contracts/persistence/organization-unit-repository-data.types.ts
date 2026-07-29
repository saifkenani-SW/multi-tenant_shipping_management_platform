import { OrgType } from '../../enums/org-type.enum';

export interface CreateOrganizationUnitRepositoryData {
  readonly tenantId: string;
  readonly name: string;
  readonly orgType: OrgType;
  readonly parentId: string | null;
  readonly zoneId: string | null;
  readonly addressLine: string | null;
  readonly longitude: number | null;
  readonly latitude: number | null;
}

export interface UpdateOrganizationUnitRepositoryData {
  readonly name?: string;
  readonly zoneId?: string | null;
  readonly addressLine?: string | null;
  readonly isActive?: boolean;
  readonly longitude?: number | null;
  readonly latitude?: number | null;
}
