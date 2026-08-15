import { Test, TestingModule } from '@nestjs/testing';

import { LocationFlusherService } from './location-flusher.service';
import { TripLocationRepository } from '../../infrastructure/repositories/trip-location.repository';

// ── Redis mock ────────────────────────────────────────────────────────────────

const mockRedis = {
  rpush: jest.fn(),
  scan: jest.fn(),
  multi: jest.fn(),
};

const mockMultiChain = {
  lrange: jest.fn().mockReturnThis(),
  ltrim: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

// ── Repository mock ───────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<TripLocationRepository> = {
  createMany: jest.fn(),
} as any;

// ─────────────────────────────────────────────────────────────────────────────

describe('LocationFlusherService', () => {
  let service: LocationFlusherService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.multi.mockReturnValue(mockMultiChain);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationFlusherService,
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
        { provide: TripLocationRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(LocationFlusherService);
  });

  // ── buffer() ───────────────────────────────────────────────────────────────

  describe('buffer()', () => {
    it('RPUSHes a JSON-serialised entry to the correct key', async () => {
      const entry = {
        tripId: 'trip-1',
        driverId: 'driver-1',
        latitude: 24.7136,
        longitude: 46.6753,
        recordedAt: new Date('2024-01-01T10:00:00Z'),
      };

      await service.buffer(entry);

      expect(mockRedis.rpush).toHaveBeenCalledWith(
        'trip:locations:trip-1',
        JSON.stringify(entry),
      );
    });
  });

  // ── flush() ────────────────────────────────────────────────────────────────

  describe('flush()', () => {
    it('does nothing when no keys exist in Redis', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', []]); // single scan pass, no keys

      await service.flush();

      expect(mockRedis.multi).not.toHaveBeenCalled();
      expect(mockRepo.createMany).not.toHaveBeenCalled();
    });

    it('scans and flushes a single trip key', async () => {
      const rawEntry = JSON.stringify({
        tripId: 'trip-1',
        driverId: 'driver-1',
        latitude: 24.7136,
        longitude: 46.6753,
        recordedAt: new Date('2024-01-01T10:00:00Z'),
      });

      // SCAN returns one key
      mockRedis.scan.mockResolvedValueOnce(['0', ['trip:locations:trip-1']]);

      // MULTI/EXEC: [lrange result, ltrim result]
      mockMultiChain.exec.mockResolvedValueOnce([
        [null, [rawEntry]],
        [null, 'OK'],
      ]);

      await service.flush();

      expect(mockRedis.multi).toHaveBeenCalledTimes(1);
      expect(mockMultiChain.lrange).toHaveBeenCalledWith('trip:locations:trip-1', 0, -1);
      expect(mockMultiChain.ltrim).toHaveBeenCalledWith('trip:locations:trip-1', 1, 0);
      expect(mockRepo.createMany).toHaveBeenCalledWith([
        expect.objectContaining({
          tripId: 'trip-1',
          driverId: 'driver-1',
          latitude: 24.7136,
          longitude: 46.6753,
        }),
      ]);
    });

    it('flushes multiple trip keys in a single run', async () => {
      mockRedis.scan.mockResolvedValueOnce([
        '0',
        ['trip:locations:trip-A', 'trip:locations:trip-B'],
      ]);

      const entryA = JSON.stringify({ tripId: 'trip-A', driverId: 'd1', latitude: 1, longitude: 1, recordedAt: new Date() });
      const entryB = JSON.stringify({ tripId: 'trip-B', driverId: 'd2', latitude: 2, longitude: 2, recordedAt: new Date() });

      mockMultiChain.exec
        .mockResolvedValueOnce([[null, [entryA]], [null, 'OK']])
        .mockResolvedValueOnce([[null, [entryB]], [null, 'OK']]);

      await service.flush();

      expect(mockRepo.createMany).toHaveBeenCalledTimes(2);
    });

    it('skips a key when exec returns null', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', ['trip:locations:trip-1']]);
      mockMultiChain.exec.mockResolvedValueOnce(null);

      await service.flush();

      expect(mockRepo.createMany).not.toHaveBeenCalled();
    });

    it('skips a key when lrange returns empty list', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', ['trip:locations:trip-1']]);
      mockMultiChain.exec.mockResolvedValueOnce([[null, []], [null, 'OK']]);

      await service.flush();

      expect(mockRepo.createMany).not.toHaveBeenCalled();
    });

    it('skips malformed JSON entries and persists the rest', async () => {
      const validEntry = JSON.stringify({
        tripId: 'trip-1', driverId: 'd1', latitude: 10, longitude: 20, recordedAt: new Date(),
      });

      mockRedis.scan.mockResolvedValueOnce(['0', ['trip:locations:trip-1']]);
      mockMultiChain.exec.mockResolvedValueOnce([
        [null, ['NOT_VALID_JSON', validEntry]],
        [null, 'OK'],
      ]);

      await service.flush();

      expect(mockRepo.createMany).toHaveBeenCalledWith([
        expect.objectContaining({ tripId: 'trip-1' }),
      ]);
    });

    it('handles LRANGE error gracefully without throwing', async () => {
      mockRedis.scan.mockResolvedValueOnce(['0', ['trip:locations:trip-1']]);
      mockMultiChain.exec.mockResolvedValueOnce([
        [new Error('Redis LRANGE error'), null],
        [null, 'OK'],
      ]);

      await expect(service.flush()).resolves.not.toThrow();
      expect(mockRepo.createMany).not.toHaveBeenCalled();
    });

    it('handles multi-cursor SCAN correctly', async () => {
      // Simulate cursor pagination: first scan returns cursor '42', second returns '0'
      mockRedis.scan
        .mockResolvedValueOnce(['42', ['trip:locations:trip-1']])
        .mockResolvedValueOnce(['0',  ['trip:locations:trip-2']]);

      mockMultiChain.exec
        .mockResolvedValue([[null, []], [null, 'OK']]); // empty lists

      await service.flush();

      expect(mockRedis.scan).toHaveBeenCalledTimes(2);
    });
  });
});
