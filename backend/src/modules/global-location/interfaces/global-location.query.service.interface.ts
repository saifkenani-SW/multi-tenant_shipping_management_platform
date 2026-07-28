import { GlobalLocationQueryDto } from '../dtos/requests/global-location-query.dto';
import { GlobalLocationDetailsDto } from '../dtos/responses/global-location-details.dto';
import { PaginatedGlobalLocationListDto } from '../dtos/responses/global-location-list.dto';

export interface IGlobalLocationQueryService {
  findLocations(
    query: GlobalLocationQueryDto,
  ): Promise<PaginatedGlobalLocationListDto>;
  getLocationDetails(id: string): Promise<GlobalLocationDetailsDto>;
}
