import {
  CreateOrganizationUnitRepositoryData,
  UpdateOrganizationUnitRepositoryData,
} from '../contracts/persistence/organization-unit-repository-data.types';

export interface IOrganizationUnitCommandRepository {
  create(data: CreateOrganizationUnitRepositoryData): Promise<string>;
  update(id: string, data: UpdateOrganizationUnitRepositoryData): Promise<void>;
  delete(id: string): Promise<void>;

  /** استبدال كامل لتغطية الوحدة داخل transaction واحدة. */
  setCoverage(
    id: string,
    tenantId: string,
    locationIds: readonly string[],
  ): Promise<void>;
}
