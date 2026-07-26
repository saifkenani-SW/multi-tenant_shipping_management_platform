import { InMemoryCacheProvider } from './InMemoryCacheProvider';

describe('InMemoryCacheProvider', () => {
  let provider: InMemoryCacheProvider;

  beforeEach(() => {
    provider = new InMemoryCacheProvider();
  });

  describe('remember', () => {
    it('should handle Cache Miss and call loader once', async () => {
      const loader = jest.fn().mockResolvedValue('value');
      const result = await provider.remember('key1', loader, 10);

      expect(result).toBe('value');
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should handle Cache Hit and not call loader', async () => {
      await provider.set('key1', 'cached-value', 10);

      const loader = jest.fn();
      const result = await provider.remember('key1', loader, 10);

      expect(result).toBe('cached-value');
      expect(loader).not.toHaveBeenCalled();
    });

    it('should expire ttl and act as miss', async () => {
      await provider.set('key1', 'value', -1); // expired

      const loader = jest.fn().mockResolvedValue('new-value');
      const result = await provider.remember('key1', loader, 10);

      expect(result).toBe('new-value');
      expect(loader).toHaveBeenCalledTimes(1);
    });
  });

  describe('rememberMany', () => {
    it('should handle empty input', async () => {
      const loader = jest.fn();
      const result = await provider.rememberMany([], loader);
      expect(result.size).toBe(0);
      expect(loader).not.toHaveBeenCalled();
    });

    it('should handle all hit', async () => {
      await provider.set('key:1', { id: '1' });
      await provider.set('key:2', { id: '2' });

      const loader = jest.fn();
      const result = await provider.rememberMany(
        [
          { id: '1', key: 'key:1' },
          { id: '2', key: 'key:2' },
        ],
        loader,
      );

      expect(result.size).toBe(2);
      expect(result.get('1')).toEqual({ id: '1' });
      expect(result.get('2')).toEqual({ id: '2' });
      expect(loader).not.toHaveBeenCalled();
    });

    it('should handle all miss', async () => {
      const loader = jest.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]);

      const result = await provider.rememberMany(
        [
          { id: '1', key: 'key:1' },
          { id: '2', key: 'key:2' },
        ],
        loader,
      );

      expect(result.size).toBe(2);
      expect(loader).toHaveBeenCalledWith(['1', '2']);
    });

    it('should handle partial hit', async () => {
      await provider.set('key:1', { id: '1' });

      const loader = jest.fn().mockResolvedValue([{ id: '2' }]);

      const result = await provider.rememberMany(
        [
          { id: '1', key: 'key:1' },
          { id: '2', key: 'key:2' },
        ],
        loader,
      );

      expect(result.size).toBe(2);
      expect(loader).toHaveBeenCalledWith(['2']);
    });

    it('should handle duplicate ids gracefully', async () => {
      const loader = jest.fn().mockResolvedValue([{ id: '1' }]);

      const result = await provider.rememberMany(
        [
          { id: '1', key: 'key:1' },
          { id: '1', key: 'key:1' },
        ],
        loader,
      );

      expect(result.size).toBe(1);
    });

    it('should handle loader returning unexpected id', async () => {
      const loader = jest.fn().mockResolvedValue([{ id: 'unexpected' }]);

      const result = await provider.rememberMany(
        [{ id: '1', key: 'key:1' }],
        loader,
      );

      expect(result.size).toBe(0);
    });
  });

  describe('get / getMany', () => {
    it('get should return null for missing key', async () => {
      expect(await provider.get('missing')).toBeNull();
    });

    it('getMany should return empty map for empty input', async () => {
      const res = await provider.getMany([]);
      expect(res.size).toBe(0);
    });

    it('getMany should return partial found', async () => {
      await provider.set('k1', 'v1');
      const res = await provider.getMany(['k1', 'k2']);
      expect(res.size).toBe(1);
      expect(res.get('k1')).toBe('v1');
    });
  });

  describe('set / setMany', () => {
    it('setMany should set multiple keys', async () => {
      await provider.setMany([
        { key: 'a', value: 1 },
        { key: 'b', value: 2 },
      ]);

      expect(await provider.get('a')).toBe(1);
      expect(await provider.get('b')).toBe(2);
    });
  });

  describe('del / delByPattern', () => {
    it('del should delete a key', async () => {
      await provider.set('k1', 'v');
      await provider.del('k1');
      expect(await provider.get('k1')).toBeNull();
    });

    it('delByPattern should delete matching keys', async () => {
      await provider.set('user:1', 'a');
      await provider.set('user:2', 'b');
      await provider.set('post:1', 'c');

      await provider.delByPattern('user:*');

      expect(await provider.get('user:1')).toBeNull();
      expect(await provider.get('user:2')).toBeNull();
      expect(await provider.get('post:1')).toBe('c');
    });
  });

  describe('isHealthy', () => {
    it('should return true', async () => {
      expect(await provider.isHealthy()).toBe(true);
    });
  });
});
