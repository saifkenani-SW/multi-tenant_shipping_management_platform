import { RequestCacheStore } from './RequestCacheStore';
import { CacheContainer } from '../container/CacheContainer';
import { AsyncLocalStorage } from 'node:async_hooks';
import { RequestContext } from '../../../packages/context/interfaces/request-context.interface';

describe('RequestCacheStore', () => {
  let storage: AsyncLocalStorage<RequestContext>;

  beforeEach(() => {
    storage = new AsyncLocalStorage<RequestContext>();

    // نحاكي AsyncContextProvider عبر mock
    jest.spyOn(CacheContainer, 'get').mockReturnValue({
      get: () => storage.getStore(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * يُشغِّل الكود داخل سياق Request كامل
   */
  function runInRequestContext<T>(fn: () => T): T {
    const context: RequestContext = { requestId: 'test-req-1' };
    return storage.run(context, fn);
  }

  describe('get', () => {
    it('should return undefined when no request context is active', () => {
      // لا يوجد storage.run() → getStore() = undefined
      const result = RequestCacheStore.get('any-key');
      expect(result).toBeUndefined();
    });

    it('should return undefined on cache miss inside a request context', () => {
      runInRequestContext(() => {
        const result = RequestCacheStore.get<string>('missing-key');
        expect(result).toBeUndefined();
      });
    });

    it('should return the stored value on cache hit', () => {
      runInRequestContext(() => {
        RequestCacheStore.set('tenant:details:abc', { id: 'abc', name: 'Test' });

        const result = RequestCacheStore.get<{ id: string; name: string }>(
          'tenant:details:abc',
        );

        expect(result).toEqual({ id: 'abc', name: 'Test' });
      });
    });
  });

  describe('set', () => {
    it('should do nothing (no-op) when no request context is active', () => {
      // لا يرمي exception
      expect(() => RequestCacheStore.set('key', 'value')).not.toThrow();
    });

    it('should initialize cache Map lazily on first set', () => {
      runInRequestContext(() => {
        const context = storage.getStore()!;
        expect(context.cache).toBeUndefined();

        RequestCacheStore.set('key1', 'value1');

        expect(context.cache).toBeInstanceOf(Map);
        expect(context.cache!.size).toBe(1);
      });
    });

    it('should store multiple keys independently', () => {
      runInRequestContext(() => {
        RequestCacheStore.set('tenant:details:1', { id: '1' });
        RequestCacheStore.set('tenant:details:2', { id: '2' });
        RequestCacheStore.set('tenant:settings:1', { currency: 'SAR' });

        expect(RequestCacheStore.get('tenant:details:1')).toEqual({ id: '1' });
        expect(RequestCacheStore.get('tenant:details:2')).toEqual({ id: '2' });
        expect(RequestCacheStore.get('tenant:settings:1')).toEqual({ currency: 'SAR' });
      });
    });
  });

  describe('delete', () => {
    it('should remove a key from the request cache', () => {
      runInRequestContext(() => {
        RequestCacheStore.set('key', 'value');
        expect(RequestCacheStore.get('key')).toBe('value');

        RequestCacheStore.delete('key');
        expect(RequestCacheStore.get('key')).toBeUndefined();
      });
    });

    it('should do nothing when no context is active', () => {
      expect(() => RequestCacheStore.delete('key')).not.toThrow();
    });
  });

  describe('size', () => {
    it('should return 0 when no context is active', () => {
      expect(RequestCacheStore.size()).toBe(0);
    });

    it('should return 0 when context exists but cache is empty', () => {
      runInRequestContext(() => {
        expect(RequestCacheStore.size()).toBe(0);
      });
    });

    it('should return correct size after multiple sets', () => {
      runInRequestContext(() => {
        RequestCacheStore.set('k1', 'v1');
        RequestCacheStore.set('k2', 'v2');
        RequestCacheStore.set('k3', 'v3');

        expect(RequestCacheStore.size()).toBe(3);
      });
    });
  });

  describe('hasContext', () => {
    it('should return false when no request context is active', () => {
      expect(RequestCacheStore.hasContext()).toBe(false);
    });

    it('should return true inside an active request context', () => {
      runInRequestContext(() => {
        expect(RequestCacheStore.hasContext()).toBe(true);
      });
    });
  });

  describe('isolation between requests', () => {
    it('should keep request caches isolated from each other', async () => {
      const results: Array<string | undefined> = [];

      const req1 = new Promise<void>((resolve) => {
        const ctx1: RequestContext = { requestId: 'req-1' };
        storage.run(ctx1, () => {
          RequestCacheStore.set('shared-key', 'value-from-req-1');
          // نحاكي async delay
          setTimeout(() => {
            results.push(
              RequestCacheStore.get<string>('shared-key'),
            );
            resolve();
          }, 10);
        });
      });

      const req2 = new Promise<void>((resolve) => {
        const ctx2: RequestContext = { requestId: 'req-2' };
        storage.run(ctx2, () => {
          // req-2 لا يخزن شيئاً
          setTimeout(() => {
            results.push(
              RequestCacheStore.get<string>('shared-key'),
            );
            resolve();
          }, 5);
        });
      });

      await Promise.all([req1, req2]);

      // req-2 يُنهي أولاً → undefined
      expect(results[0]).toBeUndefined();
      // req-1 يُنهي ثانياً → قيمته الخاصة
      expect(results[1]).toBe('value-from-req-1');
    });
  });

  describe('graceful degradation when CacheContainer throws', () => {
    it('should return undefined without throwing when CacheContainer is not initialized', () => {
      jest.spyOn(CacheContainer, 'get').mockImplementation(() => {
        throw new Error('CacheContainer has not been initialized');
      });

      expect(() => RequestCacheStore.get('key')).not.toThrow();
      expect(RequestCacheStore.get('key')).toBeUndefined();
    });

    it('should not throw on set when CacheContainer is not initialized', () => {
      jest.spyOn(CacheContainer, 'get').mockImplementation(() => {
        throw new Error('CacheContainer has not been initialized');
      });

      expect(() => RequestCacheStore.set('key', 'value')).not.toThrow();
    });
  });
});
