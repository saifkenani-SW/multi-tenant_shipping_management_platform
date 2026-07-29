import { RedisCacheProvider } from './RedisCacheProvider';
import { Redis } from 'ioredis';

describe('RedisCacheProvider', () => {
  let provider: RedisCacheProvider;
  let redis: jest.Mocked<Redis>;

  beforeEach(() => {
    // المزوّد يحذف بـ UNLINK لا DEL: الأول غير حاجز ويحرّر الذاكرة في
    // خيط منفصل، وهو ما يمنع توقف Redis عند حذف دفعة كبيرة.
    const mockPipeline = {
      set: jest.fn().mockReturnThis(),
      unlink: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    redis = {
      get: jest.fn(),
      mget: jest.fn(),
      set: jest.fn(),
      unlink: jest.fn(),
      scan: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn(),
      pipeline: jest.fn().mockReturnValue(mockPipeline),
    } as unknown as jest.Mocked<Redis>;

    provider = new RedisCacheProvider(redis, {
      circuitBreaker: {
        errorThresholdPercentage: 1,
        volumeThreshold: 1,
        resetTimeout: 10,
      },
    });
  });

  describe('remember', () => {
    it('should return cached value on hit and not call loader', async () => {
      redis.get.mockResolvedValue(JSON.stringify('cached-val'));
      const loader = jest.fn();

      const result = await provider.remember('key1', loader);

      expect(result).toBe('cached-val');
      expect(loader).not.toHaveBeenCalled();
    });

    it('should call loader on miss and set value', async () => {
      redis.get.mockResolvedValue(null);
      redis.set.mockResolvedValue('OK' as any);
      const loader = jest.fn().mockResolvedValue('new-val');

      const result = await provider.remember('key1', loader, 50);

      expect(result).toBe('new-val');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(redis.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify('new-val'),
        'EX',
        50,
      );
    });

    it('should fail-safe and return loader value if redis get fails', async () => {
      redis.get.mockRejectedValue(new Error('Redis Error'));
      const loader = jest.fn().mockResolvedValue('fallback-val');

      const result = await provider.remember('key1', loader);

      expect(result).toBe('fallback-val');
      expect(redis.set).not.toHaveBeenCalled();
    });
  });

  describe('rememberMany', () => {
    it('should return empty map for empty input', async () => {
      const loader = jest.fn();
      const result = await provider.rememberMany([], loader);
      expect(result.size).toBe(0);
      expect(redis.mget).not.toHaveBeenCalled();
    });

    it('should handle all hit using MGET', async () => {
      redis.mget.mockResolvedValue([
        JSON.stringify({ id: '1' }),
        JSON.stringify({ id: '2' }),
      ]);
      const loader = jest.fn();

      const result = await provider.rememberMany(
        [
          { id: '1', key: 'k:1' },
          { id: '2', key: 'k:2' },
        ],
        loader,
      );

      expect(result.size).toBe(2);
      expect(loader).not.toHaveBeenCalled();
      expect(redis.mget).toHaveBeenCalledWith('k:1', 'k:2');
    });

    it('should handle all miss and use pipeline to set', async () => {
      redis.mget.mockResolvedValue([null, null]);
      const loader = jest.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await provider.rememberMany(
        [
          { id: '1', key: 'k:1' },
          { id: '2', key: 'k:2' },
        ],
        loader,
        100,
      );

      expect(result.size).toBe(2);
      expect(loader).toHaveBeenCalledWith(['1', '2']);

      const pipeline = redis.pipeline();
      expect(pipeline.set).toHaveBeenCalledWith(
        'k:1',
        JSON.stringify({ id: '1' }),
        'EX',
        100,
      );
      expect(pipeline.set).toHaveBeenCalledWith(
        'k:2',
        JSON.stringify({ id: '2' }),
        'EX',
        100,
      );
      expect(pipeline.exec).toHaveBeenCalled();
    });

    it('should handle partial hit', async () => {
      redis.mget.mockResolvedValue([JSON.stringify({ id: '1' }), null]);
      const loader = jest.fn().mockResolvedValue([{ id: '2' }]);

      const result = await provider.rememberMany(
        [
          { id: '1', key: 'k:1' },
          { id: '2', key: 'k:2' },
        ],
        loader,
      );

      expect(result.size).toBe(2);
      expect(loader).toHaveBeenCalledWith(['2']);
    });

    it('should ignore unexpected loader ids', async () => {
      redis.mget.mockResolvedValue([null]);
      const loader = jest.fn().mockResolvedValue([{ id: 'unexpected' }]);

      const result = await provider.rememberMany(
        [{ id: '1', key: 'k:1' }],
        loader,
      );

      expect(result.size).toBe(0);
    });

    it('should fail-safe if MGET fails', async () => {
      redis.mget.mockRejectedValue(new Error('Redis Down'));
      const loader = jest.fn().mockResolvedValue([{ id: '1' }]);

      const result = await provider.rememberMany(
        [{ id: '1', key: 'k:1' }],
        loader,
      );

      expect(result.size).toBe(1);
    });
  });

  describe('get', () => {
    it('should return parsed value on success', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ val: 123 }));
      const result = await provider.get('key1');
      expect(result).toEqual({ val: 123 });
      expect(redis.get).toHaveBeenCalledWith('key1');
    });

    it('should return null if key is not found', async () => {
      redis.get.mockResolvedValue(null);
      const result = await provider.get('key1');
      expect(result).toBeNull();
    });

    it('should fail-safe and return null on redis error', async () => {
      redis.get.mockRejectedValue(new Error('fail'));
      const result = await provider.get('key1');
      expect(result).toBeNull();
    });
  });

  describe('getMany', () => {
    it('should return empty map for empty input', async () => {
      const result = await provider.getMany([]);
      expect(result.size).toBe(0);
      expect(redis.mget).not.toHaveBeenCalled();
    });

    it('should return parsed values for existing keys', async () => {
      redis.mget.mockResolvedValue([
        JSON.stringify({ v: 1 }),
        null,
        JSON.stringify({ v: 3 }),
      ]);
      const result = await provider.getMany(['k1', 'k2', 'k3']);
      expect(result.size).toBe(2);
      expect(result.get('k1')).toEqual({ v: 1 });
      expect(result.get('k3')).toEqual({ v: 3 });
      expect(redis.mget).toHaveBeenCalledWith('k1', 'k2', 'k3');
    });

    it('should fail-safe and return empty map on redis error', async () => {
      redis.mget.mockRejectedValue(new Error('fail'));
      const result = await provider.getMany(['k1']);
      expect(result.size).toBe(0);
    });
  });

  describe('set', () => {
    it('should call redis set with JSON stringified value and default ttl', async () => {
      await provider.set('key1', { val: 123 });
      expect(redis.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify({ val: 123 }),
        'EX',
        300,
      );
    });

    it('should call redis set with custom ttl', async () => {
      await provider.set('key1', { val: 123 }, 50);
      expect(redis.set).toHaveBeenCalledWith(
        'key1',
        JSON.stringify({ val: 123 }),
        'EX',
        50,
      );
    });

    it('should fail-safe on redis error', async () => {
      redis.set.mockRejectedValue(new Error('fail'));
      await expect(provider.set('key1', { val: 123 })).resolves.not.toThrow();
    });
  });

  describe('setMany', () => {
    it('should do nothing for empty input', async () => {
      await provider.setMany([]);
      expect(redis.pipeline).not.toHaveBeenCalled();
    });

    it('should pipeline set commands and exec them', async () => {
      await provider.setMany([
        { key: 'k1', value: { v: 1 } },
        { key: 'k2', value: { v: 2 }, ttl: 50 },
      ]);
      const pipeline = redis.pipeline();
      expect(pipeline.set).toHaveBeenCalledWith(
        'k1',
        JSON.stringify({ v: 1 }),
        'EX',
        300,
      );
      expect(pipeline.set).toHaveBeenCalledWith(
        'k2',
        JSON.stringify({ v: 2 }),
        'EX',
        50,
      );
      expect(pipeline.exec).toHaveBeenCalled();
    });

    it('should fail-safe on redis pipeline error', async () => {
      const pipeline = redis.pipeline();
      (pipeline.exec as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(
        provider.setMany([{ key: 'k1', value: { v: 1 } }]),
      ).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should unlink the key instead of blocking on DEL', async () => {
      await provider.del('key1');
      expect(redis.unlink).toHaveBeenCalledWith('key1');
    });

    it('should fail-safe on error', async () => {
      redis.unlink.mockRejectedValue(new Error('fail'));
      await expect(provider.del('key1')).resolves.not.toThrow();
    });
  });

  describe('delByPattern', () => {
    it('should use SCAN and Pipeline deletion', async () => {
      redis.scan
        .mockResolvedValueOnce(['10', ['key:1', 'key:2']])
        .mockResolvedValueOnce(['0', ['key:3']]);

      await provider.delByPattern('key:*');

      expect(redis.scan).toHaveBeenCalledTimes(2);

      const pipeline = redis.pipeline();
      expect(pipeline.unlink).toHaveBeenCalledWith('key:1');
      expect(pipeline.unlink).toHaveBeenCalledWith('key:2');
      expect(pipeline.unlink).toHaveBeenCalledWith('key:3');
      expect(pipeline.exec).toHaveBeenCalled();
    });

    it('should do nothing if no keys found', async () => {
      redis.scan.mockResolvedValue(['0', []]);
      await provider.delByPattern('key:*');
      expect(redis.pipeline().exec).not.toHaveBeenCalled();
    });

    it('should fail-safe on error', async () => {
      redis.scan.mockRejectedValue(new Error('fail'));
      await expect(provider.delByPattern('key:*')).resolves.not.toThrow();
    });
  });

  describe('isHealthy & onModuleDestroy', () => {
    it('should return true if PING returns PONG', async () => {
      redis.ping.mockResolvedValue('PONG');
      expect(await provider.isHealthy()).toBe(true);
    });

    it('should return false if PING fails', async () => {
      redis.ping.mockRejectedValue(new Error());
      expect(await provider.isHealthy()).toBe(false);
    });

    it('should quit redis on module destroy', async () => {
      await provider.onModuleDestroy();
      expect(redis.quit).toHaveBeenCalled();
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker on consecutive failures', async () => {
      redis.get.mockRejectedValue(new Error('Fail'));

      await provider.get('key');
      await provider.get('key');

      redis.get.mockClear();

      await provider.get('key');

      expect(redis.get).not.toHaveBeenCalled();
    });
  });
});
