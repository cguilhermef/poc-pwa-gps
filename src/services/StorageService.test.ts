import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { StorageService, type StoredPoint } from './StorageService';
import type { LocationPoint } from '../types';

const createMockPoint = (overrides: Partial<LocationPoint> = {}): LocationPoint => ({
  timestamp: new Date().toISOString(),
  latitude: -23.5505,
  longitude: -46.6333,
  accuracy: 10,
  heading: 90,
  speed: 5,
  isOfflineBuffer: false,
  ...overrides,
});

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService(indexedDB);
  });

  afterEach(async () => {
    await service.clear();
    await service.close();
  });

  describe('isSupported', () => {
    it('returns true when IndexedDB is available', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('returns false when IndexedDB is not available', () => {
      const unsupportedService = new StorageService(null as unknown as IDBFactory);
      expect(unsupportedService.isSupported()).toBe(false);
    });
  });

  describe('savePoint', () => {
    it('saves a point and returns an id', async () => {
      const point = createMockPoint();
      const id = await service.savePoint(point);

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('sets isOfflineBuffer to true when saving', async () => {
      const point = createMockPoint({ isOfflineBuffer: false });
      await service.savePoint(point);

      const pending = await service.getPendingPoints(10);
      expect(pending[0].isOfflineBuffer).toBe(true);
    });

    it('adds storedAt timestamp to saved point', async () => {
      const point = createMockPoint();
      await service.savePoint(point);

      const pending = await service.getPendingPoints(10);
      expect(pending[0].storedAt).toBeDefined();
      expect(new Date(pending[0].storedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('generates unique ids for each point', async () => {
      const point1 = createMockPoint();
      const point2 = createMockPoint();

      const id1 = await service.savePoint(point1);
      const id2 = await service.savePoint(point2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('getPendingPoints', () => {
    it('returns empty array when no points are stored', async () => {
      const points = await service.getPendingPoints(10);
      expect(points).toEqual([]);
    });

    it('returns points in chronological order (by timestamp)', async () => {
      const point1 = createMockPoint({ timestamp: '2024-01-01T10:00:00.000Z' });
      const point2 = createMockPoint({ timestamp: '2024-01-01T09:00:00.000Z' });
      const point3 = createMockPoint({ timestamp: '2024-01-01T11:00:00.000Z' });

      await service.savePoint(point1);
      await service.savePoint(point2);
      await service.savePoint(point3);

      const pending = await service.getPendingPoints(10);

      expect(pending[0].timestamp).toBe('2024-01-01T09:00:00.000Z');
      expect(pending[1].timestamp).toBe('2024-01-01T10:00:00.000Z');
      expect(pending[2].timestamp).toBe('2024-01-01T11:00:00.000Z');
    });

    it('respects the limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await service.savePoint(createMockPoint());
      }

      const points = await service.getPendingPoints(3);
      expect(points).toHaveLength(3);
    });

    it('discards points older than 24 hours', async () => {
      const now = Date.now();
      const oldStoredAt = new Date(now - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago

      const recentPoint = createMockPoint({ timestamp: '2024-01-02T10:00:00.000Z' });
      await service.savePoint(recentPoint);

      const expiredPoint = createMockPoint({ timestamp: '2024-01-01T10:00:00.000Z' });
      const expiredId = await service.savePoint(expiredPoint);

      const db = await (service as unknown as { getDb: () => Promise<unknown> }).getDb();
      const tx = (db as { transaction: (store: string, mode: string) => { store: { put: (point: StoredPoint) => Promise<void> }; done: Promise<void> } }).transaction('pending-points', 'readwrite');
      await tx.store.put({
        ...expiredPoint,
        id: expiredId,
        storedAt: oldStoredAt,
        isOfflineBuffer: true,
      });
      await tx.done;

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const pending = await service.getPendingPoints(10);

      expect(pending).toHaveLength(1);
      expect(pending[0].timestamp).toBe('2024-01-02T10:00:00.000Z');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Discarded 1 expired points'));

      warnSpy.mockRestore();
    });
  });

  describe('removePoints', () => {
    it('removes points by their ids', async () => {
      const id1 = await service.savePoint(createMockPoint());
      const id2 = await service.savePoint(createMockPoint());
      const id3 = await service.savePoint(createMockPoint());

      await service.removePoints([id1, id3]);

      const pending = await service.getPendingPoints(10);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(id2);
    });

    it('handles empty array gracefully', async () => {
      await service.savePoint(createMockPoint());
      await service.removePoints([]);

      const pending = await service.getPendingPoints(10);
      expect(pending).toHaveLength(1);
    });

    it('handles non-existent ids gracefully', async () => {
      const id = await service.savePoint(createMockPoint());
      await service.removePoints(['non-existent-id']);

      const pending = await service.getPendingPoints(10);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(id);
    });
  });

  describe('size', () => {
    it('returns 0 when no points are stored', async () => {
      const count = await service.size();
      expect(count).toBe(0);
    });

    it('returns correct count of stored points', async () => {
      await service.savePoint(createMockPoint());
      await service.savePoint(createMockPoint());
      await service.savePoint(createMockPoint());

      const count = await service.size();
      expect(count).toBe(3);
    });

    it('updates count after removal', async () => {
      const id1 = await service.savePoint(createMockPoint());
      await service.savePoint(createMockPoint());

      expect(await service.size()).toBe(2);

      await service.removePoints([id1]);

      expect(await service.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('removes all stored points', async () => {
      await service.savePoint(createMockPoint());
      await service.savePoint(createMockPoint());

      await service.clear();

      const count = await service.size();
      expect(count).toBe(0);
    });
  });

  describe('error handling', () => {
    it('throws error when IndexedDB is not supported', async () => {
      const unsupportedService = new StorageService(null as unknown as IDBFactory);

      await expect(unsupportedService.savePoint(createMockPoint())).rejects.toThrow(
        'IndexedDB is not supported in this environment'
      );
    });
  });

  describe('persistence', () => {
    it('persists data across service instances', async () => {
      const point = createMockPoint({ timestamp: '2024-01-01T12:00:00.000Z' });
      await service.savePoint(point);
      await service.close();

      const newService = new StorageService(indexedDB);
      const pending = await newService.getPendingPoints(10);

      expect(pending).toHaveLength(1);
      expect(pending[0].timestamp).toBe('2024-01-01T12:00:00.000Z');

      await newService.clear();
      await newService.close();
    });
  });
});
