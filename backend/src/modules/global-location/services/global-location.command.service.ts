import { Inject, Injectable } from '@nestjs/common';

import { CacheEvict } from '../../../infrastructure/cache/decorators/CacheEvict';
import { Authorize } from '../../../packages/authorization';
import { Policy } from '../../../packages/authorization/policy';
import {
  GlobalLocationAction,
  GlobalLocationPolicy,
} from '../authorization';
import { GLOBAL_LOCATION_CACHE_KEYS } from '../constants/global-location.cache.constants';
import { CreateGlobalLocationDto } from '../dtos/requests/create-global-location.dto';
import { UpdateGlobalLocationDto } from '../dtos/requests/update-global-location.dto';
import {
  LOCATION_TYPE_LEVEL,
  LocationType,
} from '../enums/location-type.enum';
import { GlobalLocationNotFoundException } from '../exceptions/global-location-not-found.exception';
import { InvalidLocationHierarchyException } from '../exceptions/invalid-location-hierarchy.exception';
import { LocationHasChildrenException } from '../exceptions/location-has-children.exception';
import { LocationInUseException } from '../exceptions/location-in-use.exception';
import type { IGlobalLocationCommandRepository } from '../interfaces/global-location.command.repository.interface';
import { IGlobalLocationCommandService } from '../interfaces/global-location.command.service.interface';
import type { IGlobalLocationQueryRepository } from '../interfaces/global-location.query.repository.interface';
import {
  GLOBAL_LOCATION_COMMAND_REPOSITORY_TOKEN,
  GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN,
} from '../tokens/global-location-repository.tokens';

@Injectable()
export class GlobalLocationCommandService implements IGlobalLocationCommandService {
  constructor(
    @Inject(GLOBAL_LOCATION_COMMAND_REPOSITORY_TOKEN)
    private readonly commandRepository: IGlobalLocationCommandRepository,
    @Inject(GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN)
    private readonly queryRepository: IGlobalLocationQueryRepository,
  ) {}

  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @Authorize({
    policy: Policy(GlobalLocationPolicy, GlobalLocationAction.Create),
    payloadResolver: (dto: CreateGlobalLocationDto) => ({ dto }),
  })
  async createLocation(dto: CreateGlobalLocationDto): Promise<string> {
    await this.assertValidHierarchy(dto.type, dto.parentId);

    return this.commandRepository.create({
      name: dto.name,
      type: dto.type,
      parentId: dto.parentId ?? null,
      longitude: dto.longitude ?? null,
      latitude: dto.latitude ?? null,
    });
  }

  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [GLOBAL_LOCATION_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(GlobalLocationPolicy, GlobalLocationAction.Update),
    payloadResolver: (locationId: string, dto: UpdateGlobalLocationDto) => ({
      locationId,
      dto,
    }),
  })
  async updateLocation(
    id: string,
    dto: UpdateGlobalLocationDto,
  ): Promise<void> {
    const location = await this.queryRepository.findById(id);

    if (!location) {
      throw new GlobalLocationNotFoundException();
    }

    await this.commandRepository.update(id, {
      name: dto.name,
      longitude: dto.longitude,
      latitude: dto.latitude,
    });
  }

  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.LIST,
    allEntries: true,
  })
  @CacheEvict({
    keyPrefix: GLOBAL_LOCATION_CACHE_KEYS.DETAILS,
    keyBuilder: (id: string) => [GLOBAL_LOCATION_CACHE_KEYS.DETAILS, id],
  })
  @Authorize({
    policy: Policy(GlobalLocationPolicy, GlobalLocationAction.Delete),
    payloadResolver: (locationId: string) => ({ locationId }),
  })
  async deleteLocation(id: string): Promise<void> {
    const location = await this.queryRepository.findById(id);

    if (!location) {
      throw new GlobalLocationNotFoundException();
    }

    const childCount = await this.queryRepository.countChildren(id);

    if (childCount > 0) {
      throw new LocationHasChildrenException(childCount);
    }

    // العلاقة مع org_unit_location_mapping هي cascade: الحذف يسحب
    // تغطية فروع قائمة بلا أثر.
    const mappingCount = await this.queryRepository.countOrgUnitMappings(id);

    if (mappingCount > 0) {
      throw new LocationInUseException(mappingCount);
    }

    await this.commandRepository.delete(id);
  }

  /**
   * الهرم ينزل مستوى واحداً بالضبط: دولة بلا أب، وكل ما دونها تحت
   * المستوى الذي يسبقه مباشرة.
   */
  private async assertValidHierarchy(
    type: LocationType,
    parentId?: string,
  ): Promise<void> {
    if (type === LocationType.COUNTRY) {
      if (parentId) {
        throw new InvalidLocationHierarchyException(type, null);
      }
      return;
    }

    if (!parentId) {
      throw new InvalidLocationHierarchyException(type, null);
    }

    const parent = await this.queryRepository.findById(parentId);

    if (!parent) {
      throw new GlobalLocationNotFoundException();
    }

    const expectedParentLevel = LOCATION_TYPE_LEVEL[type] - 1;

    if (LOCATION_TYPE_LEVEL[parent.type] !== expectedParentLevel) {
      throw new InvalidLocationHierarchyException(type, parent.type);
    }
  }
}
