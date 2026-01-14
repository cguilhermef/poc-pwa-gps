import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  LocationService,
  formatPositionToLocationPoint,
  formatGeolocationError,
  type LocationError,
} from './LocationService';
import type { LocationPoint } from '../types';

const mockPosition: GeolocationPosition = {
  coords: {
    latitude: -23.5505,
    longitude: -46.6333,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: 90,
    speed: 5,
  },
  timestamp: 1704067200000,
};

const mockPositionError = (code: number): GeolocationPositionError => ({
  code,
  message: 'Test error',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
});

describe('LocationService', () => {
  let mockWatchPosition: ReturnType<typeof vi.fn>;
  let mockClearWatch: ReturnType<typeof vi.fn>;
  let mockGetCurrentPosition: ReturnType<typeof vi.fn>;
  let mockPermissionsQuery: ReturnType<typeof vi.fn>;
  let mockGeolocation: Partial<Geolocation>;
  let mockPermissions: Partial<Permissions>;

  beforeEach(() => {
    mockWatchPosition = vi.fn();
    mockClearWatch = vi.fn();
    mockGetCurrentPosition = vi.fn();
    mockPermissionsQuery = vi.fn();

    mockGeolocation = {
      watchPosition: mockWatchPosition,
      clearWatch: mockClearWatch,
      getCurrentPosition: mockGetCurrentPosition,
    };

    mockPermissions = {
      query: mockPermissionsQuery,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('returns true when geolocation is available', () => {
      const service = new LocationService({ geolocation: mockGeolocation as Geolocation });
      expect(service.isSupported()).toBe(true);
    });

    it('returns false when geolocation is not available', () => {
      const service = new LocationService({ geolocation: undefined });
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('returns "granted" when permission is granted', async () => {
      mockPermissionsQuery.mockResolvedValue({ state: 'granted' });
      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        permissions: mockPermissions as Permissions,
      });
      const result = await service.checkPermission();
      expect(result).toBe('granted');
    });

    it('returns "denied" when permission is denied', async () => {
      mockPermissionsQuery.mockResolvedValue({ state: 'denied' });
      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        permissions: mockPermissions as Permissions,
      });
      const result = await service.checkPermission();
      expect(result).toBe('denied');
    });

    it('returns "prompt" when permission needs to be requested', async () => {
      mockPermissionsQuery.mockResolvedValue({ state: 'prompt' });
      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        permissions: mockPermissions as Permissions,
      });
      const result = await service.checkPermission();
      expect(result).toBe('prompt');
    });

    it('returns "unavailable" when geolocation is not supported', async () => {
      const service = new LocationService({ geolocation: undefined });
      const result = await service.checkPermission();
      expect(result).toBe('unavailable');
    });

    it('returns "prompt" when permissions API throws', async () => {
      mockPermissionsQuery.mockRejectedValue(new Error('Not supported'));
      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        permissions: mockPermissions as Permissions,
      });
      const result = await service.checkPermission();
      expect(result).toBe('prompt');
    });
  });

  describe('requestPermission', () => {
    it('returns "granted" when getCurrentPosition succeeds', async () => {
      mockGetCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });
      const service = new LocationService({ geolocation: mockGeolocation as Geolocation });
      const result = await service.requestPermission();
      expect(result).toBe('granted');
    });

    it('returns "denied" when permission is denied', async () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error(mockPositionError(1));
      });
      const service = new LocationService({ geolocation: mockGeolocation as Geolocation });
      const result = await service.requestPermission();
      expect(result).toBe('denied');
    });

    it('returns "granted" when error is not permission denied', async () => {
      mockGetCurrentPosition.mockImplementation((_, error) => {
        error(mockPositionError(2));
      });
      const service = new LocationService({ geolocation: mockGeolocation as Geolocation });
      const result = await service.requestPermission();
      expect(result).toBe('granted');
    });

    it('returns "unavailable" when geolocation is not supported', async () => {
      const service = new LocationService({ geolocation: undefined });
      const result = await service.requestPermission();
      expect(result).toBe('unavailable');
    });
  });

  describe('start/stop', () => {
    it('calls watchPosition with correct options', () => {
      mockWatchPosition.mockReturnValue(1);
      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000,
      });
      const onLocation = vi.fn();

      service.start(onLocation);

      expect(mockWatchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000,
        }
      );
    });

    it('stops watching when stop is called', () => {
      mockWatchPosition.mockReturnValue(42);
      const service = new LocationService({ geolocation: mockGeolocation as Geolocation });
      const onLocation = vi.fn();

      service.start(onLocation);
      expect(service.isWatching()).toBe(true);

      service.stop();
      expect(mockClearWatch).toHaveBeenCalledWith(42);
      expect(service.isWatching()).toBe(false);
    });

    it('stops previous watch when start is called again', () => {
      mockWatchPosition.mockReturnValueOnce(1).mockReturnValueOnce(2);
      const service = new LocationService({ geolocation: mockGeolocation as Geolocation });
      const onLocation = vi.fn();

      service.start(onLocation);
      service.start(onLocation);

      expect(mockClearWatch).toHaveBeenCalledWith(1);
      expect(mockWatchPosition).toHaveBeenCalledTimes(2);
    });

    it('calls onError when geolocation is not supported', () => {
      const service = new LocationService({ geolocation: undefined });
      const onLocation = vi.fn();
      const onError = vi.fn();

      service.start(onLocation, onError);

      expect(onError).toHaveBeenCalledWith({
        code: 'NOT_SUPPORTED',
        message: 'Geolocalização não suportada neste navegador',
      });
    });
  });

  describe('throttling', () => {
    it('emits first position immediately', () => {
      let successCallback: (pos: GeolocationPosition) => void;
      mockWatchPosition.mockImplementation((success) => {
        successCallback = success;
        return 1;
      });
      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        throttleMs: 30000,
      });
      const onLocation = vi.fn();

      service.start(onLocation);
      successCallback!({ ...mockPosition, timestamp: 30000 });

      expect(onLocation).toHaveBeenCalledTimes(1);
    });

    it('throttles positions within throttleMs', () => {
      let successCallback: (pos: GeolocationPosition) => void;
      mockWatchPosition.mockImplementation((success) => {
        successCallback = success;
        return 1;
      });

      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        throttleMs: 30000,
      });
      const onLocation = vi.fn();

      service.start(onLocation);

      successCallback!({ ...mockPosition, timestamp: 30000 });
      successCallback!({ ...mockPosition, timestamp: 45000 });
      successCallback!({ ...mockPosition, timestamp: 59000 });

      expect(onLocation).toHaveBeenCalledTimes(1);
    });

    it('emits position after throttleMs elapsed', () => {
      let successCallback: (pos: GeolocationPosition) => void;
      mockWatchPosition.mockImplementation((success) => {
        successCallback = success;
        return 1;
      });

      const service = new LocationService({
        geolocation: mockGeolocation as Geolocation,
        throttleMs: 30000,
      });
      const onLocation = vi.fn();

      service.start(onLocation);

      successCallback!({ ...mockPosition, timestamp: 30000 });
      successCallback!({ ...mockPosition, timestamp: 60000 });
      successCallback!({ ...mockPosition, timestamp: 90000 });

      expect(onLocation).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('calls onError callback when geolocation error occurs', () => {
      let errorCallback: (err: GeolocationPositionError) => void;
      mockWatchPosition.mockImplementation((_, error) => {
        errorCallback = error;
        return 1;
      });

      const service = new LocationService({ geolocation: mockGeolocation as Geolocation });
      const onLocation = vi.fn();
      const onError = vi.fn();

      service.start(onLocation, onError);
      errorCallback!(mockPositionError(1));

      expect(onError).toHaveBeenCalledWith({
        code: 'PERMISSION_DENIED',
        message: 'Permissão de localização negada',
      });
    });
  });
});

describe('formatPositionToLocationPoint', () => {
  it('formats GeolocationPosition to LocationPoint correctly', () => {
    const result = formatPositionToLocationPoint(mockPosition);

    expect(result).toEqual<LocationPoint>({
      timestamp: '2024-01-01T00:00:00.000Z',
      latitude: -23.5505,
      longitude: -46.6333,
      accuracy: 10,
      heading: 90,
      speed: 5,
      isOfflineBuffer: false,
    });
  });

  it('handles null values in coords', () => {
    const positionWithNulls: GeolocationPosition = {
      coords: {
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 1704067200000,
    };

    const result = formatPositionToLocationPoint(positionWithNulls);

    expect(result.heading).toBeNull();
    expect(result.speed).toBeNull();
  });
});

describe('formatGeolocationError', () => {
  it('formats PERMISSION_DENIED error', () => {
    const result = formatGeolocationError(mockPositionError(1));
    expect(result).toEqual<LocationError>({
      code: 'PERMISSION_DENIED',
      message: 'Permissão de localização negada',
    });
  });

  it('formats POSITION_UNAVAILABLE error', () => {
    const result = formatGeolocationError(mockPositionError(2));
    expect(result).toEqual<LocationError>({
      code: 'POSITION_UNAVAILABLE',
      message: 'Posição indisponível',
    });
  });

  it('formats TIMEOUT error', () => {
    const result = formatGeolocationError(mockPositionError(3));
    expect(result).toEqual<LocationError>({
      code: 'TIMEOUT',
      message: 'Tempo limite excedido ao obter localização',
    });
  });

  it('formats unknown error as POSITION_UNAVAILABLE', () => {
    const unknownError = {
      code: 99,
      message: 'Unknown error',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError;

    const result = formatGeolocationError(unknownError);
    expect(result).toEqual<LocationError>({
      code: 'POSITION_UNAVAILABLE',
      message: 'Unknown error',
    });
  });
});
