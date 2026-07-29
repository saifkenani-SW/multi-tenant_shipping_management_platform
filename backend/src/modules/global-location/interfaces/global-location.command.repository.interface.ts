import {
  CreateGlobalLocationRepositoryData,
  UpdateGlobalLocationRepositoryData,
} from '../contracts/persistence/global-location-repository-data.types';

export interface IGlobalLocationCommandRepository {
  create(data: CreateGlobalLocationRepositoryData): Promise<string>;
  update(id: string, data: UpdateGlobalLocationRepositoryData): Promise<void>;
  delete(id: string): Promise<void>;
}
