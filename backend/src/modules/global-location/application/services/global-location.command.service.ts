import { Injectable } from '@nestjs/common';
import { GlobalLocationCommandRepository } from '../../infrastructure/repositories/global-location.command.repository';
import { CreateGlobalLocationDto } from '../dtos/requests/create-global-location.dto';
import { UpdateGlobalLocationDto } from '../dtos/requests/update-global-location.dto';
import { CacheEvict } from '../../../../infrastructure/cache/decorators/CacheEvict';
import { GLOBAL_LOCATION_CACHE_KEYS } from '../../constants/global-location.cache.constants';

@Injectable()
export class GlobalLocationCommandService {
  constructor(private readonly repository: GlobalLocationCommandRepository) {}

  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.LIST,
    allEntries: true,
  })
  async create(data: CreateGlobalLocationDto): Promise<string> {
    return this.repository.create(data);
  }

  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [GLOBAL_LOCATION_CACHE_KEYS.DETAILS, id],
  })
  async update(id: string, data: UpdateGlobalLocationDto): Promise<void> {
    await this.repository.update(id, data);
  }

  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [GLOBAL_LOCATION_CACHE_KEYS.DETAILS, id],
  })
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
