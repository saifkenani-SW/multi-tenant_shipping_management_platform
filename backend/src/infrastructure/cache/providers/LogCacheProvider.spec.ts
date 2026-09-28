import { LogCacheProvider } from './LogCacheProvider';
import { InMemoryCacheProvider } from './InMemoryCacheProvider';

describe('LogCacheProvider', () => {
  let inner: InMemoryCacheProvider;
  let log: LogCacheProvider;

  beforeEach(() => {
    inner = new InMemoryCacheProvider();
    log = new LogCacheProvider(inner);
  });

  describe('get', () => {
    it('should log a MISS when key does not exist', async () => {
      await log.get('missing-key');

      const entry = log.getLastLog()!;
      expect(entry.op).toBe('GET');
      expect(entry.key).toBe('missing-key');
      expect(entry.hit).toBe(false);
    });

    it('should log a HIT when key exists', async () => {
      await inner.set('my-key', 'value', 300);

      await log.get('my-key');

      const entry = log.getLastLog()!;
      expect(entry.op).toBe('GET');
      expect(entry.hit).toBe(true);
    });
  });

  describe('set', () => {
    it('should log SET and actually store the value', async () => {
      await log.set('k', 'v', 300);

      expect(log.getLastLog()!.op).toBe('SET');
      expect(log.getLastLog()!.key).toBe('k');

      const stored = await inner.get('k');
      expect(stored).toBe('v');
    });
  });

  describe('del', () => {
    it('should log DEL with the correct key', async () => {
      await inner.set('to-delete', 'x', 300);
      await log.del('to-delete');

      expect(log.getLastLog()!.op).toBe('DEL');
      expect(log.getLastLog()!.key).toBe('to-delete');
      expect(await inner.get('to-delete')).toBeNull();
    });
  });

  describe('remember', () => {
    it('should log REMEMBER with hit=false on first call and invoke loader', async () => {
      const loader = jest.fn().mockResolvedValue('loaded-value');

      const result = await log.remember('r-key', loader, 300);

      expect(result).toBe('loaded-value');
      expect(loader).toHaveBeenCalledTimes(1);

      const entry = log.getLastLog()!;
      expect(entry.op).toBe('REMEMBER');
      expect(entry.key).toBe('r-key');
      expect(entry.hit).toBe(false);
    });

    it('should log REMEMBER with hit=true on second call and NOT invoke loader', async () => {
      const loader = jest.fn().mockResolvedValue('loaded-value');

      await log.remember('r-key', loader, 300);
      log.clearLog();

      const result = await log.remember('r-key', loader, 300);

      expect(result).toBe('loaded-value');
      expect(loader).toHaveBeenCalledTimes(1); // لم يُستدعَ مرة ثانية

      const entry = log.getLastLog()!;
      expect(entry.op).toBe('REMEMBER');
      expect(entry.hit).toBe(true);
    });
  });

  describe('countOp / countHits / countMisses', () => {
    it('should count operations and hits/misses correctly', async () => {
      const loader = jest.fn().mockResolvedValue('val');

      // مرة أولى → MISS
      await log.remember('key1', loader, 300);
      // مرة ثانية → HIT
      await log.remember('key1', loader, 300);
      // مفتاح آخر → MISS
      await log.remember('key2', loader, 300);

      expect(log.countOp('REMEMBER')).toBe(3);
      expect(log.countHits('REMEMBER')).toBe(1);
      expect(log.countMisses('REMEMBER')).toBe(2);
    });
  });

  describe('clearLog', () => {
    it('should reset the log between tests', async () => {
      await log.get('x');
      expect(log.getLog().length).toBe(1);

      log.clearLog();
      expect(log.getLog().length).toBe(0);
    });
  });

  describe('full scenario: policy + service in same request', () => {
    it('simulates: LogCacheProvider confirms Redis is hit only once when Request Cache is warm', async () => {
      /**
       * هذا الاختبار يحاكي السيناريو الحقيقي:
       * - الطلب الأول: getPolicy → Redis MISS → DB loader → خزّن في Redis
       * - الطلب الثاني: getService → Redis HIT
       *
       * النتيجة المتوقعة:
       * - REMEMBER_x2 في LogCacheProvider
       * - hit=false للأولى، hit=true للثانية
       * - الـ loader يُستدعى مرة واحدة فقط
       */
      const loader = jest
        .fn()
        .mockResolvedValue({ id: 'resource-1', policy: 'view' });

      // Request الأول: getPolicy
      const policy = await log.remember('resource:policy:resource-1', loader, 300);
      expect(policy).toEqual({ id: 'resource-1', policy: 'view' });
      expect(log.countMisses('REMEMBER')).toBe(1);

      // Request الأول: getService (نفس الـ Resource)
      const service = await log.remember('resource:policy:resource-1', loader, 300);
      expect(service).toEqual({ id: 'resource-1', policy: 'view' });

      expect(loader).toHaveBeenCalledTimes(1); // ← DB لم يُستدعَ مرة ثانية
      expect(log.countHits('REMEMBER')).toBe(1);  // ← Redis HIT للثانية
      expect(log.countMisses('REMEMBER')).toBe(1); // ← Redis MISS للأولى فقط
    });
  });
});
