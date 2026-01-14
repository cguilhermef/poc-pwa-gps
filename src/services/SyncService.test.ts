import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncService, type SyncCallbacks } from './SyncService';
import { StorageService } from './StorageService';
import type { LocationPoint } from '../types';

function createMockPoint(overrides: Partial<LocationPoint> = {}): LocationPoint {
  return {
    timestamp: new Date().toISOString(),
    latitude: -23.5505,
    longitude: -46.6333,
    accuracy: 10,
    heading: null,
    speed: null,
    isOfflineBuffer: false,
    ...overrides,
  };
}

function createMockFetch(response: { ok: boolean; status?: number; body?: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    text: () => Promise.resolve(JSON.stringify(response.body ?? {})),
    json: () => Promise.resolve(response.body ?? {}),
  });
}

describe('SyncService', () => {
  let syncService: SyncService;
  let mockStorageService: StorageService;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(() => {
    vi.useFakeTimers();
    
    mockStorageService = {
      savePoint: vi.fn().mockResolvedValue('mock-id'),
      getPendingPoints: vi.fn().mockResolvedValue([]),
      removePoints: vi.fn().mockResolvedValue(undefined),
      size: vi.fn().mockResolvedValue(0),
      isSupported: vi.fn().mockReturnValue(true),
    } as unknown as StorageService;

    mockFetch = createMockFetch({ ok: true, body: { success: true, inserted: 1 } });
    
    syncService = new SyncService(mockStorageService, mockFetch);
    syncService.setSessionId('test-session');
  });

  afterEach(() => {
    syncService.stopRecoveryLoop();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('handleLocationUpdate', () => {
    it('should send point to API when online', async () => {
      const point = createMockPoint();
      const callbacks: SyncCallbacks = {
        onSendSuccess: vi.fn(),
      };
      syncService.setCallbacks(callbacks);

      await syncService.handleLocationUpdate(point);

      expect(mockFetch).toHaveBeenCalledWith('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'test-session',
          points: [point],
        }),
      });
      expect(callbacks.onSendSuccess).toHaveBeenCalledWith(point);
      expect(mockStorageService.savePoint).not.toHaveBeenCalled();
    });

    it('should save point to storage when API fails', async () => {
      mockFetch = createMockFetch({ ok: false, status: 500, body: { error: 'Server error' } });
      syncService = new SyncService(mockStorageService, mockFetch);
      syncService.setSessionId('test-session');

      const point = createMockPoint();
      const callbacks: SyncCallbacks = {
        onSendError: vi.fn(),
        onPendingCountChange: vi.fn(),
      };
      syncService.setCallbacks(callbacks);

      await syncService.handleLocationUpdate(point);

      expect(mockStorageService.savePoint).toHaveBeenCalledWith(point);
      expect(callbacks.onSendError).toHaveBeenCalled();
    });

    it('should save point to storage when network fails', async () => {
      mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      syncService = new SyncService(mockStorageService, mockFetch);
      syncService.setSessionId('test-session');

      const point = createMockPoint();
      const callbacks: SyncCallbacks = {
        onSendError: vi.fn(),
        onPendingCountChange: vi.fn(),
      };
      syncService.setCallbacks(callbacks);

      await syncService.handleLocationUpdate(point);

      expect(mockStorageService.savePoint).toHaveBeenCalledWith(point);
      expect(callbacks.onSendError).toHaveBeenCalledWith(point, expect.any(Error));
    });

    it('should not send if sessionId is not set', async () => {
      syncService.setSessionId('');
      const point = createMockPoint();

      await syncService.handleLocationUpdate(point);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockStorageService.savePoint).not.toHaveBeenCalled();
    });
  });

  describe('recoverPendingPoints', () => {
    it('should send pending points in batch', async () => {
      const storedPoints = [
        { ...createMockPoint(), id: 'id-1', storedAt: new Date().toISOString() },
        { ...createMockPoint(), id: 'id-2', storedAt: new Date().toISOString() },
      ];
      
      vi.mocked(mockStorageService.size).mockResolvedValueOnce(2).mockResolvedValueOnce(0);
      vi.mocked(mockStorageService.getPendingPoints).mockResolvedValue(storedPoints);

      const callbacks: SyncCallbacks = {
        onRecoveryStart: vi.fn(),
        onRecoverySuccess: vi.fn(),
        onPendingCountChange: vi.fn(),
      };
      syncService.setCallbacks(callbacks);

      await syncService.recoverPendingPoints();

      expect(mockFetch).toHaveBeenCalledWith('/api/track', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"isOfflineBuffer":true'),
      }));
      expect(mockStorageService.removePoints).toHaveBeenCalledWith(['id-1', 'id-2']);
      expect(callbacks.onRecoverySuccess).toHaveBeenCalledWith(2);
    });

    it('should not recover if no pending points', async () => {
      vi.mocked(mockStorageService.size).mockResolvedValue(0);

      await syncService.recoverPendingPoints();

      expect(mockStorageService.getPendingPoints).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call onRecoveryError when recovery fails', async () => {
      const storedPoints = [
        { ...createMockPoint(), id: 'id-1', storedAt: new Date().toISOString() },
      ];
      
      vi.mocked(mockStorageService.size).mockResolvedValue(1);
      vi.mocked(mockStorageService.getPendingPoints).mockResolvedValue(storedPoints);
      mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      syncService = new SyncService(mockStorageService, mockFetch);
      syncService.setSessionId('test-session');

      const callbacks: SyncCallbacks = {
        onRecoveryStart: vi.fn(),
        onRecoveryError: vi.fn(),
      };
      syncService.setCallbacks(callbacks);

      await syncService.recoverPendingPoints();

      expect(callbacks.onRecoveryError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockStorageService.removePoints).not.toHaveBeenCalled();
    });

    it('should not run concurrent recoveries', async () => {
      const storedPoints = [
        { ...createMockPoint(), id: 'id-1', storedAt: new Date().toISOString() },
      ];
      
      let resolveGetPending: ((value: typeof storedPoints) => void) | null = null;
      let sizeCallCount = 0;
      vi.mocked(mockStorageService.size).mockImplementation(() => {
        sizeCallCount++;
        return Promise.resolve(sizeCallCount <= 2 ? 1 : 0);
      });
      vi.mocked(mockStorageService.getPendingPoints).mockImplementation(() => {
        return new Promise((resolve) => {
          resolveGetPending = resolve;
        });
      });

      const promise1 = syncService.recoverPendingPoints();
      await Promise.resolve();
      
      const promise2 = syncService.recoverPendingPoints();

      await Promise.resolve();
      expect(mockStorageService.getPendingPoints).toHaveBeenCalledTimes(1);

      resolveGetPending!(storedPoints);
      await promise1;
      await promise2;

      expect(mockStorageService.getPendingPoints).toHaveBeenCalledTimes(1);
    });
  });

  describe('recovery loop', () => {
    it('should start recovery loop and run periodically', async () => {
      vi.mocked(mockStorageService.size).mockResolvedValue(0);

      syncService.startRecoveryLoop();

      expect(mockStorageService.size).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(30000);
      await Promise.resolve();

      expect(mockStorageService.size).toHaveBeenCalledTimes(2);
    });

    it('should stop recovery loop', async () => {
      vi.mocked(mockStorageService.size).mockResolvedValue(0);

      syncService.startRecoveryLoop();
      syncService.stopRecoveryLoop();

      vi.advanceTimersByTime(60000);
      await Promise.resolve();

      expect(mockStorageService.size).toHaveBeenCalledTimes(1);
    });
  });

  describe('status management', () => {
    it('should update status during send', async () => {
      const statuses: string[] = [];
      const callbacks: SyncCallbacks = {
        onStatusChange: (status) => statuses.push(status),
      };
      syncService.setCallbacks(callbacks);

      const point = createMockPoint();
      await syncService.handleLocationUpdate(point);

      expect(statuses).toContain('sending');
      expect(statuses[statuses.length - 1]).toBe('idle');
    });

    it('should update status during recovery', async () => {
      const storedPoints = [
        { ...createMockPoint(), id: 'id-1', storedAt: new Date().toISOString() },
      ];
      
      vi.mocked(mockStorageService.size).mockResolvedValueOnce(1).mockResolvedValueOnce(0);
      vi.mocked(mockStorageService.getPendingPoints).mockResolvedValue(storedPoints);

      const statuses: string[] = [];
      const callbacks: SyncCallbacks = {
        onStatusChange: (status) => statuses.push(status),
      };
      syncService.setCallbacks(callbacks);

      await syncService.recoverPendingPoints();

      expect(statuses).toContain('recovering');
      expect(statuses[statuses.length - 1]).toBe('idle');
    });
  });
});
