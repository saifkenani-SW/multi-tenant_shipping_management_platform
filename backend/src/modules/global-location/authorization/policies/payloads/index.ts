import { CreateGlobalLocationDto } from '../../../dtos/requests/create-global-location.dto';
import { UpdateGlobalLocationDto } from '../../../dtos/requests/update-global-location.dto';

export interface CreateGlobalLocationPayload {
  dto: CreateGlobalLocationDto;
}

export interface ViewGlobalLocationPayload {
  locationId?: string;
}

export interface UpdateGlobalLocationPayload {
  locationId: string;
  dto: UpdateGlobalLocationDto;
}

export interface DeleteGlobalLocationPayload {
  locationId: string;
}
