import { CacheContainerInitializer } from './CacheContainerInitializer';
import { ModuleRef } from '@nestjs/core';
import { CacheContainer } from './CacheContainer';

describe('CacheContainerInitializer', () => {
  let initializer: CacheContainerInitializer;
  let moduleRef: jest.Mocked<ModuleRef>;

  beforeEach(() => {
    moduleRef = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ModuleRef>;

    initializer = new CacheContainerInitializer(moduleRef);

    // reset container
    (CacheContainer as any).moduleRef = undefined;
  });

  it('should register ModuleRef on module init', () => {
    initializer.onModuleInit();

    moduleRef.get.mockReturnValue('mock-service');
    expect(CacheContainer.get('token')).toBe('mock-service');
  });

  it('should allow initialization only once or override safely', () => {
    initializer.onModuleInit();
    initializer.onModuleInit();

    moduleRef.get.mockReturnValue('mock-service');
    expect(CacheContainer.get('token')).toBe('mock-service');
  });
});
