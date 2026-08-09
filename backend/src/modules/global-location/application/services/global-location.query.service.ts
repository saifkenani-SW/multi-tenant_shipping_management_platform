import { Injectable, NotFoundException } from '@nestjs/common';
import { GlobalLocationQueryRepository } from '../../infrastructure/repositories/global-location.query.repository';
import { GlobalLocationQueryDto } from '../dtos/requests/global-location-query.dto';
import { GlobalLocationResponseDto } from '../dtos/responses/global-location.response.dto';
import { CursorPaginatedResponse } from '../../../../common/pagination/cursor/responses/cursor-paginated-response';

@Injectable()
export class GlobalLocationQueryService {
  constructor(private readonly repository: GlobalLocationQueryRepository) {}

  async findMany(
    criteria: GlobalLocationQueryDto,
  ): Promise<CursorPaginatedResponse<GlobalLocationResponseDto>> {
    return this.repository.findMany(criteria);
  }

  async findById(id: string): Promise<GlobalLocationResponseDto> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Global Location with ID ${id} not found`);
    }
    return record;
  }

  async validateLocationsExist(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    return this.repository.validateLocationsExist(ids);
  }

  async getLocationsByIds(
    ids: string[],
    failIfMissing = true,
  ): Promise<GlobalLocationResponseDto[]> {
    if (!ids || ids.length === 0) return [];

    const locations = await this.repository.findByIds(ids);

    if (failIfMissing && locations.length !== ids.length) {
      throw new NotFoundException('One or more Global Locations not found');
    }

    return locations;
  }
}

