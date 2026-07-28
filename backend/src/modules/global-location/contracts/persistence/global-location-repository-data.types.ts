import { LocationType } from '../../enums/location-type.enum';

export interface CreateGlobalLocationRepositoryData {
  readonly name: string;
  readonly type: LocationType;
  readonly parentId: string | null;
  readonly longitude: number | null;
  readonly latitude: number | null;
}

export interface UpdateGlobalLocationRepositoryData {
  readonly name?: string;
  readonly longitude?: number | null;
  readonly latitude?: number | null;
}
