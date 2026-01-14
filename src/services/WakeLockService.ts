export type WakeLockState = 'active' | 'released' | 'unsupported' | 'error';

export interface WakeLockCallbacks {
  onStateChange?: (state: WakeLockState) => void;
  onError?: (error: Error) => void;
}

export class WakeLockService {
  private wakeLock: WakeLockSentinel | null = null;
  private callbacks: WakeLockCallbacks = {};
  private isRequesting = false;

  isSupported(): boolean {
    return 'wakeLock' in navigator;
  }

  setCallbacks(callbacks: WakeLockCallbacks): void {
    this.callbacks = callbacks;
  }

  async acquire(): Promise<WakeLockState> {
    if (!this.isSupported()) {
      this.callbacks.onStateChange?.('unsupported');
      return 'unsupported';
    }

    if (this.wakeLock !== null || this.isRequesting) {
      return 'active';
    }

    this.isRequesting = true;

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
        this.callbacks.onStateChange?.('released');
      });

      this.callbacks.onStateChange?.('active');
      return 'active';
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onError?.(err);
      this.callbacks.onStateChange?.('error');
      return 'error';
    } finally {
      this.isRequesting = false;
    }
  }

  async release(): Promise<void> {
    if (this.wakeLock !== null) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  isActive(): boolean {
    return this.wakeLock !== null;
  }

  async reacquireOnVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && this.wakeLock === null) {
      await this.acquire();
    }
  }
}
