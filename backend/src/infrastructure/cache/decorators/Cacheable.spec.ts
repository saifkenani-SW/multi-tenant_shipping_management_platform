import { Cacheable } from './Cacheable';
import { CacheStrategy } from './cache-strategy.enum';
import { CacheContainer } from '../container/CacheContainer';
import { ICacheFacade } from '../../../core/cache/interfaces/ICacheFacade';
import { RequestCacheStore } from '../request/RequestCacheStore';

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

  // ──────────────────────────────────────────────
  // SINGLE Strategy — السلوك الأصلي
  // ──────────────────────────────────────────────

  it('should use SINGLE strategy by default, use method name as prefix, and resolve through CacheContainer', async () => {
    class TestService {
      @Cacheable({ ttl: 60 })
      async getData(id: string) {
        return `data-${id}`;
      }
    }

    const service = new TestService();
    cacheFacade.remember.mockImplementation(async (_keyParts, loader, _ttl) => {
      return loader();
    });

    const result = await service.getData('123');

    expect(result).toBe('data-123');
    expect(CacheContainer.get).toHaveBeenCalled();
    expect(cacheFacade.remember).toHaveBeenCalledWith(
      ['getData', '123'],
      expect.any(Function),
      60,
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
      undefined,
    );
  });

  // ──────────────────────────────────────────────
  // SINGLE Strategy — Request Cache
  // ──────────────────────────────────────────────

  describe('Request Cache (SINGLE strategy)', () => {
    it('should return from Request Cache on second call without hitting Redis', async () => {
      const requestCacheMap = new Map<string, unknown>();

      // نحاكي RequestCacheStore
      jest.spyOn(RequestCacheStore, 'get').mockImplementation((key) => {
        return requestCacheMap.get(key) as any;
      });
      jest.spyOn(RequestCacheStore, 'set').mockImplementation((key, value) => {
        requestCacheMap.set(key, value);
      });

      class TestService {
        @Cacheable({ keyBuilder: (id: string) => ['tenant:details', id] })
        async findById(id: string) {
          return { id, name: 'Tenant A' };
        }
      }

      const service = new TestService();
      cacheFacade.remember.mockResolvedValue({ id: '1', name: 'Tenant A' });

      // الاستدعاء الأول → Request Cache MISS → Redis
      await service.findById('1');
      expect(cacheFacade.remember).toHaveBeenCalledTimes(1);

      // الاستدعاء الثاني → Request Cache HIT
      const result = await service.findById('1');
      expect(result).toEqual({ id: '1', name: 'Tenant A' });
      expect(cacheFacade.remember).toHaveBeenCalledTimes(1); // لم يُستدعَ مرة ثانية
    });

    it('should skip Request Cache when requestCache: false', async () => {
      const getSpy = jest.spyOn(RequestCacheStore, 'get');
      const setSpy = jest.spyOn(RequestCacheStore, 'set');

      class TestService {
        @Cacheable({
          requestCache: false,
          keyBuilder: (id: string) => ['tenant:details', id],
        })
        async findById(id: string) {
          return { id };
        }
      }

      cacheFacade.remember.mockResolvedValue({ id: '1' });

      const service = new TestService();
      await service.findById('1');
      await service.findById('1');

      expect(getSpy).not.toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();
      expect(cacheFacade.remember).toHaveBeenCalledTimes(2); // يضرب Redis في كل مرة
    });

    it('should work normally when Request Cache returns undefined (no context)', async () => {
      jest.spyOn(RequestCacheStore, 'get').mockReturnValue(undefined);
      jest.spyOn(RequestCacheStore, 'set').mockImplementation(() => {});

      class TestService {
        @Cacheable({ keyBuilder: (id: string) => ['tenant:details', id] })
        async findById(id: string) {
          return { id };
        }
      }

      cacheFacade.remember.mockResolvedValue({ id: '99' });
      const service = new TestService();
      const result = await service.findById('99');

      expect(result).toEqual({ id: '99' });
      expect(cacheFacade.remember).toHaveBeenCalledTimes(1);
    });
  });

  // ──────────────────────────────────────────────
  // MANY Strategy — السلوك الأصلي
  // ──────────────────────────────────────────────

  it('should use MANY strategy and execute loader correctly', async () => {
    class TestService {
      @Cacheable({
        strategy: CacheStrategy.MANY,
        keyPrefix: 'bulk',
        ids: (args: string[]) => args,
        loader: (args: unknown[], missingIds: string[]) => [missingIds],
      })
      async getManyData(ids: string[]) {
        return ids.map((id) => ({ id, val: `data-${id}` }));
      }
    }

    const service = new TestService();

    // عند requestCache=true لكن RequestCacheStore لا يجد شيئاً
    jest.spyOn(RequestCacheStore, 'get').mockReturnValue(undefined);
    jest.spyOn(RequestCacheStore, 'set').mockImplementation(() => {});

    cacheFacade.rememberMany.mockImplementation(
      async (_prefix, _ids, loader, _ttl) => {
        const loaded = await loader(['2']);
        const map = new Map<string, any>();
        for (const item of loaded) {
          map.set(item.id, item);
        }
        return map;
      },
    );

    const result = await service.getManyData(['1', '2']);

    expect(cacheFacade.rememberMany).toHaveBeenCalledWith(
      'bulk',
      ['1', '2'],
      expect.any(Function),
      undefined,
    );

    const mapResult = result as unknown as Map<string, any>;
    expect(mapResult.get('2')).toEqual({ id: '2', val: 'data-2' });
  });

  // ──────────────────────────────────────────────
  // MANY Strategy — Request Cache
  // ──────────────────────────────────────────────

  describe('Request Cache (MANY strategy)', () => {
    it('should return all IDs from Request Cache without hitting Redis when all are warm', async () => {
      // نحاكي Request Cache به كل الـ IDs
      const requestMap = new Map<string, unknown>([
        ['bulk:1', { id: '1', val: 'data-1' }],
        ['bulk:2', { id: '2', val: 'data-2' }],
      ]);

      jest.spyOn(RequestCacheStore, 'get').mockImplementation(
        (key) => requestMap.get(key) as any,
      );
      jest.spyOn(RequestCacheStore, 'set').mockImplementation(() => {});

      class TestService {
        @Cacheable({
          strategy: CacheStrategy.MANY,
          keyPrefix: 'bulk',
          ids: (args: string[]) => args,
          loader: (args: unknown[], missingIds: string[]) => [missingIds],
        })
        async getManyData(ids: string[]) {
          return ids.map((id) => ({ id, val: `data-${id}` }));
        }
      }

      const service = new TestService();
      const result = await service.getManyData(['1', '2']);

      expect(cacheFacade.rememberMany).not.toHaveBeenCalled(); // Redis لم يُلمَس
      const mapResult = result as unknown as Map<string, any>;
      expect(mapResult.get('1')).toEqual({ id: '1', val: 'data-1' });
      expect(mapResult.get('2')).toEqual({ id: '2', val: 'data-2' });
    });

    it('should only fetch missing IDs from Redis when some are in Request Cache', async () => {
      // ID 1 موجود في Request Cache، ID 2 غائب
      const requestMap = new Map<string, unknown>([
        ['bulk:1', { id: '1', val: 'data-1' }],
      ]);

      jest.spyOn(RequestCacheStore, 'get').mockImplementation(
        (key) => requestMap.get(key) as any,
      );
      jest.spyOn(RequestCacheStore, 'set').mockImplementation(() => {});

      cacheFacade.rememberMany.mockImplementation(async (_prefix, ids, _loader, _ttl) => {
        const map = new Map<string, any>();
        for (const id of ids) {
          map.set(id, { id, val: `data-${id}` });
        }
        return map;
      });

      class TestService {
        @Cacheable({
          strategy: CacheStrategy.MANY,
          keyPrefix: 'bulk',
          ids: (args: string[]) => args,
          loader: (args: unknown[], missingIds: string[]) => [missingIds],
        })
        async getManyData(ids: string[]) {
          return ids.map((id) => ({ id, val: `data-${id}` }));
        }
      }

      const service = new TestService();
      const result = await service.getManyData(['1', '2']);

      // Redis يُستدعى فقط لـ ID 2
      expect(cacheFacade.rememberMany).toHaveBeenCalledWith(
        'bulk',
        ['2'], // فقط المفقود
        expect.any(Function),
        undefined,
      );

      const mapResult = result as unknown as Map<string, any>;
      expect(mapResult.get('1')).toEqual({ id: '1', val: 'data-1' });
      expect(mapResult.get('2')).toEqual({ id: '2', val: 'data-2' });
    });
  });
});
