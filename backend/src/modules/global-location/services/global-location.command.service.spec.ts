import { Test, TestingModule } from '@nestjs/testing';

import { CacheContainer } from '../../../infrastructure/cache/container/CacheContainer';
import { AuthorizationContainer } from '../../../packages/authorization/authorization.container';
import { TransactionContainer } from '../../../packages/transaction';
import { GlobalLocation } from '../domain/global-location.entity';
import { LocationType } from '../enums/location-type.enum';
import { GlobalLocationNotFoundException } from '../exceptions/global-location-not-found.exception';
import { InvalidLocationHierarchyException } from '../exceptions/invalid-location-hierarchy.exception';
import { LocationHasChildrenException } from '../exceptions/location-has-children.exception';
import { LocationInUseException } from '../exceptions/location-in-use.exception';
import {
  GLOBAL_LOCATION_COMMAND_REPOSITORY_TOKEN,
  GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN,
} from '../tokens/global-location-repository.tokens';
import { GlobalLocationCommandService } from './global-location.command.service';

describe('GlobalLocationCommandService', () => {
  let service: GlobalLocationCommandService;
  let commandRepository: Record<string, jest.Mock>;
  let queryRepository: Record<string, jest.Mock>;

  const country = new GlobalLocation('c-1', 'Jordan', LocationType.COUNTRY);
  const governorate = new GlobalLocation(
    'g-1',
    'Amman Governorate',
    LocationType.GOVERNORATE,
    'c-1',
  );

  beforeEach(async () => {
    commandRepository = {
      create: jest.fn().mockResolvedValue('new-id'),
      update: jest.fn(),
      delete: jest.fn(),
    };

    queryRepository = {
      findById: jest.fn(),
      countChildren: jest.fn().mockResolvedValue(0),
      countOrgUnitMappings: jest.fn().mockResolvedValue(0),
      findAncestors: jest.fn(),
      findMany: jest.fn(),
    };

    jest.spyOn(AuthorizationContainer, 'get').mockReturnValue({
      authorize: jest.fn().mockResolvedValue(undefined),
      buildScope: jest.fn().mockReturnValue({}),
      buildCapabilities: jest.fn().mockResolvedValue({}),
    } as never);
    jest.spyOn(TransactionContainer, 'get').mockReturnValue({
      execute: jest.fn(async (fn) => fn({})),
    } as never);

    jest.spyOn(CacheContainer, 'get').mockReturnValue({
      evict: jest.fn().mockResolvedValue(undefined),
      evictByPrefix: jest.fn().mockResolvedValue(undefined),
    } as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalLocationCommandService,
        {
          provide: GLOBAL_LOCATION_COMMAND_REPOSITORY_TOKEN,
          useValue: commandRepository,
        },
        {
          provide: GLOBAL_LOCATION_QUERY_REPOSITORY_TOKEN,
          useValue: queryRepository,
        },
      ],
    }).compile();

    service = module.get(GlobalLocationCommandService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('صحة الهرم', () => {
    it('ينشئ دولة بلا أب', async () => {
      const id = await service.createLocation({
        name: 'Jordan',
        type: LocationType.COUNTRY,
      });

      expect(id).toBe('new-id');
      expect(commandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: null }),
      );
    });

    it('يرفض دولة لها أب', async () => {
      await expect(
        service.createLocation({
          name: 'Jordan',
          type: LocationType.COUNTRY,
          parentId: 'c-1',
        }),
      ).rejects.toThrow(InvalidLocationHierarchyException);
    });

    it('يرفض محافظة بلا أب', async () => {
      await expect(
        service.createLocation({
          name: 'Amman',
          type: LocationType.GOVERNORATE,
        }),
      ).rejects.toThrow(InvalidLocationHierarchyException);
    });

    it('يقبل محافظة تحت دولة', async () => {
      queryRepository.findById.mockResolvedValue(country);

      await service.createLocation({
        name: 'Amman Governorate',
        type: LocationType.GOVERNORATE,
        parentId: 'c-1',
      });

      expect(commandRepository.create).toHaveBeenCalled();
    });

    it('يرفض قفز مستوى: مدينة تحت دولة مباشرة', async () => {
      queryRepository.findById.mockResolvedValue(country);

      await expect(
        service.createLocation({
          name: 'Amman',
          type: LocationType.CITY,
          parentId: 'c-1',
        }),
      ).rejects.toThrow(InvalidLocationHierarchyException);
    });

    it('يرفض الصعود: دولة تحت محافظة', async () => {
      queryRepository.findById.mockResolvedValue(governorate);

      await expect(
        service.createLocation({
          name: 'X',
          type: LocationType.DISTRICT,
          parentId: 'g-1',
        }),
      ).rejects.toThrow(InvalidLocationHierarchyException);
    });

    it('يرمي NotFound عند أب غير موجود', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(
        service.createLocation({
          name: 'Amman',
          type: LocationType.GOVERNORATE,
          parentId: 'missing',
        }),
      ).rejects.toThrow(GlobalLocationNotFoundException);
    });
  });

  describe('الإحداثيات', () => {
    it('يمرّر الإحداثيات كما هي للمستودع', async () => {
      await service.createLocation({
        name: 'Jordan',
        type: LocationType.COUNTRY,
        longitude: 35.9106,
        latitude: 31.9539,
      });

      expect(commandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ longitude: 35.9106, latitude: 31.9539 }),
      );
    });

    it('يمرّر null عند غياب الإحداثيات', async () => {
      await service.createLocation({
        name: 'Jordan',
        type: LocationType.COUNTRY,
      });

      expect(commandRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ longitude: null, latitude: null }),
      );
    });
  });

  describe('deleteLocation', () => {
    it('يمنع الحذف عند وجود أبناء', async () => {
      queryRepository.findById.mockResolvedValue(country);
      queryRepository.countChildren.mockResolvedValue(12);

      await expect(service.deleteLocation('c-1')).rejects.toThrow(
        LocationHasChildrenException,
      );
      expect(commandRepository.delete).not.toHaveBeenCalled();
    });

    it('يمنع الحذف عند وجود ربط بوحدات تنظيم', async () => {
      queryRepository.findById.mockResolvedValue(governorate);
      queryRepository.countOrgUnitMappings.mockResolvedValue(3);

      await expect(service.deleteLocation('g-1')).rejects.toThrow(
        LocationInUseException,
      );
      expect(commandRepository.delete).not.toHaveBeenCalled();
    });

    it('يحذف عند خلوّه من الأبناء والارتباطات', async () => {
      queryRepository.findById.mockResolvedValue(governorate);

      await service.deleteLocation('g-1');

      expect(commandRepository.delete).toHaveBeenCalledWith('g-1');
    });

    it('يرمي NotFound عند الغياب', async () => {
      queryRepository.findById.mockResolvedValue(null);

      await expect(service.deleteLocation('missing')).rejects.toThrow(
        GlobalLocationNotFoundException,
      );
    });
  });
});
