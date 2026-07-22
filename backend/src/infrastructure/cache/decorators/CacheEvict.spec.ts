import { CacheEvict } from './CacheEvict';
import { CacheContainer } from '../container/CacheContainer';
import { ICacheFacade } from '../../../core/cache/interfaces/ICacheFacade';

describe('CacheEvict Decorator', () => {
  let cacheFacade: jest.Mocked<ICacheFacade>;

  beforeEach(() => {
    cacheFacade = {
      remember: jest.fn(),
      rememberMany: jest.fn(),
      evict: jest.fn(),
      evictByPrefix: jest.fn(),
    } as unknown as jest.Mocked<ICacheFacade>;

    jest.spyOn(CacheContainer, 'get').mockReturnValue(cacheFacade);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should evict specific key using keyPrefix', async () => {
    class TestService {
      @CacheEvict({ keyPrefix: 'prefix' })
      async updateData(id: string) {
        return 'success';
      }
    }

    const service = new TestService();
    const result = await service.updateData('123');

    expect(result).toBe('success');
    expect(cacheFacade.evict).toHaveBeenCalledWith(['prefix', '123']);
  });

  it('should evict using keyBuilder', async () => {
    class TestService {
      @CacheEvict({ keyPrefix: 'prefix', keyBuilder: (id: string) => ['custom', id] })
      async updateData(id: string) {
        return 'success';
      }
    }

    const service = new TestService();
    await service.updateData('123');

    expect(cacheFacade.evict).toHaveBeenCalledWith(['custom', '123']);
  });

  it('should evictByPrefix when allEntries is true', async () => {
    class TestService {
      @CacheEvict({ keyPrefix: 'prefix', allEntries: true })
      async updateAll() {
        return 'done';
      }
    }

    const service = new TestService();
    await service.updateAll();

    expect(cacheFacade.evictByPrefix).toHaveBeenCalledWith('prefix');
  });

  it('should preserve original exception and not evict', async () => {
    class TestService {
      @CacheEvict({ keyPrefix: 'prefix' })
      async updateData() {
        throw new Error('Business Error');
      }
    }

    const service = new TestService();
    await expect(service.updateData()).rejects.toThrow('Business Error');
    expect(cacheFacade.evict).not.toHaveBeenCalled();
  });

  it('should not affect business result if eviction fails', async () => {
    cacheFacade.evict.mockRejectedValue(new Error('Eviction Error'));

    class TestService {
      @CacheEvict({ keyPrefix: 'prefix' })
      async updateData() {
        return 'business-result';
      }
    }

    const service = new TestService();
    const result = await service.updateData();

    expect(result).toBe('business-result');
    expect(cacheFacade.evict).toHaveBeenCalled();
  });
});
