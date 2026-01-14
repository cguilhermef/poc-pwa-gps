import type { LocationPoint } from '../types';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

export type LocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_SUPPORTED';

export interface LocationError {
  code: LocationErrorCode;
  message: string;
}

export interface LocationServiceOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  throttleMs?: number;
  geolocation?: Geolocation;
  permissions?: Permissions;
}

export type LocationCallback = (point: LocationPoint) => void;
export type ErrorCallback = (error: LocationError) => void;

const DEFAULT_OPTIONS: Omit<Required<LocationServiceOptions>, 'geolocation' | 'permissions'> = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 0,
  throttleMs: 30000,
};

function formatGeolocationError(error: GeolocationPositionError): LocationError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return { code: 'PERMISSION_DENIED', message: 'Permissão de localização negada' };
    case error.POSITION_UNAVAILABLE:
      return { code: 'POSITION_UNAVAILABLE', message: 'Posição indisponível' };
    case error.TIMEOUT:
      return { code: 'TIMEOUT', message: 'Tempo limite excedido ao obter localização' };
    default:
      return { code: 'POSITION_UNAVAILABLE', message: error.message };
  }
}

function formatPositionToLocationPoint(position: GeolocationPosition): LocationPoint {
  return {
    timestamp: new Date(position.timestamp).toISOString(),
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    heading: position.coords.heading ?? null,
    speed: position.coords.speed ?? null,
    isOfflineBuffer: false,
  };
}

export class LocationService {
  private watchId: number | null = null;
  private options: Omit<Required<LocationServiceOptions>, 'geolocation' | 'permissions'>;
  private lastEmittedTimestamp: number = 0;
  private onLocation: LocationCallback | null = null;
  private onError: ErrorCallback | null = null;
  private geolocation: Geolocation | undefined;
  private permissions: Permissions | undefined;

  constructor(options: LocationServiceOptions = {}) {
    const { geolocation, permissions, ...rest } = options;
    this.options = { ...DEFAULT_OPTIONS, ...rest };
    this.geolocation = geolocation ?? (typeof navigator !== 'undefined' ? navigator.geolocation : undefined);
    this.permissions = permissions ?? (typeof navigator !== 'undefined' ? navigator.permissions : undefined);
  }

  isSupported(): boolean {
    return this.geolocation !== undefined;
  }

  async checkPermission(): Promise<PermissionState> {
    if (!this.isSupported()) {
      return 'unavailable';
    }

    if (!this.permissions) {
      return 'prompt';
    }

    try {
      const result = await this.permissions.query({ name: 'geolocation' });
      return result.state as PermissionState;
    } catch {
      return 'prompt';
    }
  }

  async requestPermission(): Promise<PermissionState> {
    if (!this.isSupported()) {
      return 'unavailable';
    }

    return new Promise((resolve) => {
      this.geolocation!.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            resolve('granted');
          }
        },
        {
          enableHighAccuracy: this.options.enableHighAccuracy,
          timeout: this.options.timeout,
          maximumAge: this.options.maximumAge,
        }
      );
    });
  }

  start(onLocation: LocationCallback, onError?: ErrorCallback): void {
    if (!this.isSupported()) {
      onError?.({ code: 'NOT_SUPPORTED', message: 'Geolocalização não suportada neste navegador' });
      return;
    }

    if (this.watchId !== null) {
      this.stop();
    }

    this.onLocation = onLocation;
    this.onError = onError ?? null;
    this.lastEmittedTimestamp = 0;

    this.watchId = this.geolocation!.watchPosition(
      this.handlePosition,
      this.handleError,
      {
        enableHighAccuracy: this.options.enableHighAccuracy,
        timeout: this.options.timeout,
        maximumAge: this.options.maximumAge,
      }
    );
  }

  stop(): void {
    if (this.watchId !== null) {
      this.geolocation?.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.onLocation = null;
    this.onError = null;
    this.lastEmittedTimestamp = 0;
  }

  isWatching(): boolean {
    return this.watchId !== null;
  }

  private handlePosition = (position: GeolocationPosition): void => {
    const now = position.timestamp;
    const elapsed = now - this.lastEmittedTimestamp;

    if (elapsed >= this.options.throttleMs) {
      this.lastEmittedTimestamp = now;
      const point = formatPositionToLocationPoint(position);
      this.onLocation?.(point);
    }
  };

  private handleError = (error: GeolocationPositionError): void => {
    const formattedError = formatGeolocationError(error);
    this.onError?.(formattedError);
  };
}

export { formatPositionToLocationPoint, formatGeolocationError };
