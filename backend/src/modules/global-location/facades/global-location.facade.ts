import { Injectable } from '@nestjs/common';
import { GlobalLocationQueryService } from '../application/services/global-location.query.service';

@Injectable()
export class GlobalLocationFacade {
  constructor(private readonly queryService: GlobalLocationQueryService) {}

  /**
   * Validates if all the provided location IDs exist in the system.
   * Returns true if they all exist, false otherwise.
   */
  async validateLocationsExist(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    return this.queryService.validateLocationsExist(ids);
  }

  /**
   * Gets a list of global locations by their IDs.
   * If failIfMissing is true, throws NotFoundException if any location is missing.
   */
  async getLocationsByIds(ids: string[], failIfMissing = true) {
    return this.queryService.getLocationsByIds(ids, failIfMissing);
  }
}

