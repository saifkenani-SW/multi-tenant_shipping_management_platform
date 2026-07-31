import { Test, TestingModule } from '@nestjs/testing';

import { PERMISSION_CATALOG_ENTRIES } from '../catalog/permission.catalog';
import { PERMISSION_COMMAND_REPOSITORY_TOKEN } from '../tokens/permission-repository.tokens';
import { PermissionSeederService } from './permission.seeder.service';

describe('PermissionSeederService', () => {
  let service: PermissionSeederService;
  let repository: { syncCatalog: jest.Mock };

  beforeEach(async () => {
    repository = { syncCatalog: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionSeederService,
        {
          provide: PERMISSION_COMMAND_REPOSITORY_TOKEN,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(PermissionSeederService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('يزامن الكتالوج كاملاً عند الإقلاع', async () => {
    repository.syncCatalog.mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(repository.syncCatalog).toHaveBeenCalledWith(
      PERMISSION_CATALOG_ENTRIES,
    );
  });

  it('لا يُسقط الإقلاع عند فشل المزامنة', async () => {
    repository.syncCatalog.mockRejectedValue(new Error('db is down'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
