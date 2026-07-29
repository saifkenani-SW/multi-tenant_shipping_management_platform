import { CreateGlobalLocationDto } from '../dtos/requests/create-global-location.dto';
import { UpdateGlobalLocationDto } from '../dtos/requests/update-global-location.dto';

export interface IGlobalLocationCommandService {
  createLocation(dto: CreateGlobalLocationDto): Promise<string>;
  updateLocation(id: string, dto: UpdateGlobalLocationDto): Promise<void>;
  deleteLocation(id: string): Promise<void>;
}
