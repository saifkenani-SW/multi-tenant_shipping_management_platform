import { Cacheable } from './Cacheable';
import { CacheStrategy } from './cache-strategy.enum';
import { CacheContainer } from '../container/CacheContainer';
import { ICacheFacade } from '../../../core/cache/interfaces/ICacheFacade';

describe('Cacheable Decorator', () => {
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

  it('should use SINGLE strategy by default, use method name as prefix, and resolve through CacheContainer', async () => {
    class TestService {
      @Cacheable({ ttl: 60 })
      async getData(id: string) {
        return `data-${id}`;
      }
    }

    const service = new TestService();
    cacheFacade.remember.mockImplementation(async (keyParts, loader, ttl) => {
      return loader();
    });

    const result = await service.getData('123');

    expect(result).toBe('data-123');
    expect(CacheContainer.get).toHaveBeenCalled();
    expect(cacheFacade.remember).toHaveBeenCalledWith(
      ['getData', '123'],
      expect.any(Function),
      60
    );
  });

  it('should use provided keyBuilder', async () => {
    class TestService {
      @Cacheable({ keyBuilder: (id: string) => ['custom', id] })
      async getData(id: string) {
        return 'data';
      }
    }

    const service = new TestService();
    await service.getData('1');
    expect(cacheFacade.remember).toHaveBeenCalledWith(
      ['custom', '1'],
      expect.any(Function),
      undefined
    );
  });

  it('should use MANY strategy and execute loader correctly', async () => {
    class TestService {
      @Cacheable({
        strategy: CacheStrategy.MANY,
        keyPrefix: 'bulk',
        ids: (args: string[]) => args,
        loader: (args: unknown[], missingIds: string[]) => [missingIds],
      })
      async getManyData(ids: string[]) {
        return ids.map(id => ({ id, val: `data-${id}` }));
      }
    }

    const service = new TestService();
    cacheFacade.rememberMany.mockImplementation(async (prefix, ids, loader, ttl) => {
      const loaded = await loader(['2']); // simulate '2' is missing
      const map = new Map<string, any>();
      for (const item of loaded) {
        map.set(item.id, item);
      }
      return map;
    });

    const result = await service.getManyData(['1', '2']);

    expect(cacheFacade.rememberMany).toHaveBeenCalledWith(
      'bulk',
      ['1', '2'],
      expect.any(Function),
      undefined
    );
    const mapResult = result as unknown as Map<string, any>;
    expect(mapResult.get('2')).toEqual({ id: '2', val: 'data-2' });
  });
});
