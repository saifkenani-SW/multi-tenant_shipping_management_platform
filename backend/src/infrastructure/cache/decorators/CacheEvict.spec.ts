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
      evictMany: jest.fn(),
    };
    jest.spyOn(CacheContainer, 'get').mockReturnValue(cacheFacade);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should evict specific key using keyPrefix', async () => {
    class TestClass {
      @CacheEvict({ keyPrefix: 'prefix' })
      async testMethod(id: string) {
        return `result-${id}`;
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod('123');

    expect(result).toBe('result-123');
    expect(cacheFacade.evict).toHaveBeenCalledWith(['prefix', '123']);
  });

  it('should evict using keyBuilder', async () => {
    class TestClass {
      @CacheEvict({
        keyPrefix: 'prefix',
        keyBuilder: (id: string, name: string) => ['custom', id, name],
      })
      async testMethod(id: string, name: string) {
        return `result-${id}-${name}`;
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod('123', 'test');

    expect(result).toBe('result-123-test');
    expect(cacheFacade.evict).toHaveBeenCalledWith(['custom', '123', 'test']);
  });

  it('should evictByPrefix when allEntries is true', async () => {
    class TestClass {
      @CacheEvict({ keyPrefix: 'prefix', allEntries: true })
      async testMethod() {
        return 'result';
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod();

    expect(result).toBe('result');
    expect(cacheFacade.evictByPrefix).toHaveBeenCalledWith('prefix');
  });

  it('should support array of eviction options', async () => {
    class TestClass {
      @CacheEvict([
        { keyPrefix: 'list', allEntries: true },
        { keyPrefix: 'details', keyBuilder: (id: string) => ['details', id] },
      ])
      async testMethod(id: string) {
        return `result-${id}`;
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod('123');

    expect(result).toBe('result-123');
    expect(cacheFacade.evictByPrefix).toHaveBeenCalledWith('list');
    expect(cacheFacade.evict).toHaveBeenCalledWith(['details', '123']);
  });

  it('should preserve original exception and not evict', async () => {
    class TestClass {
      @CacheEvict({ keyPrefix: 'prefix' })
      async testMethod() {
        throw new Error('Business Error');
      }
    }

    const instance = new TestClass();

    await expect(instance.testMethod()).rejects.toThrow('Business Error');
    expect(cacheFacade.evict).not.toHaveBeenCalled();
    expect(cacheFacade.evictByPrefix).not.toHaveBeenCalled();
  });

  it('should not affect business result if eviction fails', async () => {
    cacheFacade.evict.mockRejectedValue(new Error('Redis Error'));

    class TestClass {
      @CacheEvict({ keyPrefix: 'prefix' })
      async testMethod(id: string) {
        return `result-${id}`;
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod('123');

    expect(result).toBe('result-123');
    expect(cacheFacade.evict).toHaveBeenCalled();
  });
});
