import { CacheContainer } from './CacheContainer';
import { ModuleRef } from '@nestjs/core';

describe('CacheContainer', () => {
  let moduleRef: jest.Mocked<ModuleRef>;

  beforeEach(() => {
    moduleRef = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ModuleRef>;
    
    // reset static state
    (CacheContainer as any).moduleRef = undefined;
  });

  it('should throw if not initialized', () => {
    expect(() => CacheContainer.get('ANY_TOKEN')).toThrow(
      'CacheContainer has not been initialized. Did you import CacheModule?'
    );
  });

  it('should resolve dependency after initialization', () => {
    const mockService = { doSomething: () => true };
    moduleRef.get.mockReturnValue(mockService);

    CacheContainer.setModuleRef(moduleRef);

    const result = CacheContainer.get('ANY_TOKEN');

    expect(result).toBe(mockService);
    expect(moduleRef.get).toHaveBeenCalledWith('ANY_TOKEN', { strict: false });
  });
  
  it('should handle multiple registrations by overriding', () => {
    const moduleRef2 = { get: jest.fn() } as unknown as jest.Mocked<ModuleRef>;
    CacheContainer.setModuleRef(moduleRef);
    CacheContainer.setModuleRef(moduleRef2);
    
    CacheContainer.get('TOKEN');
    expect(moduleRef.get).not.toHaveBeenCalled();
    expect(moduleRef2.get).toHaveBeenCalled();
  });
});
