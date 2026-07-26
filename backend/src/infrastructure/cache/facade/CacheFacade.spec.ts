import { CacheFacade } from './CacheFacade';
import { ICacheProvider } from '../../../core/cache/interfaces/ICacheProvider';
import { ICacheKeyBuilder } from '../../../core/cache/interfaces/ICacheKeyBuilder';

describe('CacheFacade', () => {
  let facade: CacheFacade;
  let cacheProvider: jest.Mocked<ICacheProvider>;
  let keyBuilder: jest.Mocked<ICacheKeyBuilder>;

  beforeEach(() => {
    cacheProvider = {
      remember: jest.fn(),
      rememberMany: jest.fn(),
      del: jest.fn(),
      delByPattern: jest.fn(),
    } as unknown as jest.Mocked<ICacheProvider>;

    keyBuilder = {
      build: jest.fn(),
    } as unknown as jest.Mocked<ICacheKeyBuilder>;

    facade = new CacheFacade(cacheProvider, keyBuilder);
  });

  describe('remember', () => {
    it('should build the cache key, delegate to provider.remember, and forward ttl and loader', async () => {
      keyBuilder.build.mockReturnValue('built:key');
      const loader = jest.fn().mockResolvedValue('value');
      cacheProvider.remember.mockResolvedValue('cached-value');

      const result = await facade.remember(['part1', 'part2'], loader, 100);

      expect(keyBuilder.build).toHaveBeenCalledWith(['part1', 'part2']);
      expect(cacheProvider.remember).toHaveBeenCalledWith(
        'built:key',
        loader,
        100,
      );
      expect(result).toBe('cached-value');
    });
  });

  describe('rememberMany', () => {
    it('should remove duplicate IDs, build one cache key per unique ID, delegate to provider, and preserve Map', async () => {
      keyBuilder.build.mockImplementation((parts: any[]) => parts.join(':'));
      const loader = jest.fn();
      const mockMap = new Map([['1', { id: '1' }]]);
      cacheProvider.rememberMany.mockResolvedValue(mockMap);

      const result = await facade.rememberMany(
        'prefix',
        ['1', '2', '1'],
        loader,
        200,
      );

      expect(keyBuilder.build).toHaveBeenCalledWith(['prefix', '1']);
      expect(keyBuilder.build).toHaveBeenCalledWith(['prefix', '2']);
      expect(cacheProvider.rememberMany).toHaveBeenCalledWith(
        [
          { id: '1', key: 'prefix:1' },
          { id: '2', key: 'prefix:2' },
        ],
        loader,
        200,
      );
      expect(result).toBe(mockMap);
    });
  });

  describe('evict', () => {
    it('should build the key and call provider.del', async () => {
      keyBuilder.build.mockReturnValue('evict:key');

      await facade.evict(['part1']);

      expect(keyBuilder.build).toHaveBeenCalledWith(['part1']);
      expect(cacheProvider.del).toHaveBeenCalledWith('evict:key');
    });
  });

  describe('evictByPrefix', () => {
    it('should append :* and call provider.delByPattern', async () => {
      await facade.evictByPrefix('my:prefix');

      expect(cacheProvider.delByPattern).toHaveBeenCalledWith('my:prefix:*');
    });
  });
});
