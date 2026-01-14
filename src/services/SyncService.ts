import type { LocationPoint, TrackPayload } from '../types';
import { StorageService, type StoredPoint } from './StorageService';

const API_BASE_URL = '/api';
const RECOVERY_INTERVAL_MS = 30000; // 30 seconds
const BATCH_SIZE = 50;

export type SyncStatus = 'idle' | 'sending' | 'recovering';

export interface SyncCallbacks {
  onSendSuccess?: (point: LocationPoint) => void;
  onSendError?: (point: LocationPoint, error: Error) => void;
  onRecoveryStart?: (count: number) => void;
  onRecoverySuccess?: (count: number) => void;
  onRecoveryError?: (error: Error) => void;
  onPendingCountChange?: (count: number) => void;
  onStatusChange?: (status: SyncStatus) => void;
}

export class SyncService {
  private sessionId: string = '';
  private storageService: StorageService;
  private callbacks: SyncCallbacks = {};
  private recoveryIntervalId: ReturnType<typeof setInterval> | null = null;
  private isRecovering: boolean = false;
  private status: SyncStatus = 'idle';
  private fetchFn: typeof fetch;

  constructor(
    storageService?: StorageService,
    fetchFn?: typeof fetch
  ) {
    this.storageService = storageService ?? new StorageService();
    this.fetchFn = fetchFn ?? fetch.bind(window);
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  setCallbacks(callbacks: SyncCallbacks): void {
    this.callbacks = callbacks;
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.callbacks.onStatusChange?.(status);
  }

  private async updatePendingCount(): Promise<void> {
    const count = await this.storageService.size();
    this.callbacks.onPendingCountChange?.(count);
  }

  async handleLocationUpdate(point: LocationPoint): Promise<void> {
    if (!this.sessionId) {
      console.warn('[SyncService] No sessionId set, cannot send point');
      return;
    }

    this.setStatus('sending');

    try {
      await this.sendPoints([point]);
      this.callbacks.onSendSuccess?.(point);
    } catch (error) {
      console.warn('[SyncService] Send failed, saving to offline storage:', error);
      
      try {
        await this.storageService.savePoint(point);
        await this.updatePendingCount();
        this.callbacks.onSendError?.(point, error as Error);
      } catch (storageError) {
        console.error('[SyncService] Failed to save to offline storage:', storageError);
      }
    } finally {
      if (this.status === 'sending') {
        this.setStatus('idle');
      }
    }
  }

  private async sendPoints(points: LocationPoint[]): Promise<void> {
    const payload: TrackPayload = {
      sessionId: this.sessionId,
      points,
    };

    const response = await this.fetchFn(`${API_BASE_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }
  }

  async recoverPendingPoints(): Promise<void> {
    if (this.isRecovering) {
      return;
    }

    if (!this.sessionId) {
      return;
    }

    const pendingCount = await this.storageService.size();
    if (pendingCount === 0) {
      return;
    }

    this.isRecovering = true;
    this.setStatus('recovering');
    this.callbacks.onRecoveryStart?.(pendingCount);

    try {
      const pendingPoints = await this.storageService.getPendingPoints(BATCH_SIZE);
      
      if (pendingPoints.length === 0) {
        return;
      }

      const pointsToSend: LocationPoint[] = pendingPoints.map((stored: StoredPoint) => ({
        timestamp: stored.timestamp,
        latitude: stored.latitude,
        longitude: stored.longitude,
        accuracy: stored.accuracy,
        heading: stored.heading,
        speed: stored.speed,
        isOfflineBuffer: true,
      }));

      await this.sendPoints(pointsToSend);

      const idsToRemove = pendingPoints.map((p: StoredPoint) => p.id);
      await this.storageService.removePoints(idsToRemove);
      await this.updatePendingCount();

      this.callbacks.onRecoverySuccess?.(pointsToSend.length);

      const remainingCount = await this.storageService.size();
      if (remainingCount > 0) {
        setTimeout(() => this.recoverPendingPoints(), 100);
      }
    } catch (error) {
      console.error('[SyncService] Recovery failed:', error);
      this.callbacks.onRecoveryError?.(error as Error);
    } finally {
      this.isRecovering = false;
      this.setStatus('idle');
    }
  }

  startRecoveryLoop(): void {
    if (this.recoveryIntervalId !== null) {
      return;
    }

    this.recoverPendingPoints();

    this.recoveryIntervalId = setInterval(() => {
      if (navigator.onLine) {
        this.recoverPendingPoints();
      }
    }, RECOVERY_INTERVAL_MS);

    window.addEventListener('online', this.handleOnline);
  }

  stopRecoveryLoop(): void {
    if (this.recoveryIntervalId !== null) {
      clearInterval(this.recoveryIntervalId);
      this.recoveryIntervalId = null;
    }

    window.removeEventListener('online', this.handleOnline);
  }

  private handleOnline = (): void => {
    this.recoverPendingPoints();
  };

  async getPendingCount(): Promise<number> {
    return this.storageService.size();
  }

  isStorageSupported(): boolean {
    return this.storageService.isSupported();
  }

  getStatus(): SyncStatus {
    return this.status;
  }
}

export const syncService = new SyncService();
