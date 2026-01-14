import { useEffect, useRef, useCallback } from 'react';
import { useSession } from '../contexts/SessionContext';
import { LocationService, type LocationError } from '../services/LocationService';
import { SyncService, type SyncStatus } from '../services/SyncService';
import type { LocationPoint } from '../types';

export interface UseSyncReturn {
  syncStatus: SyncStatus;
}

export function useSync(): UseSyncReturn {
  const {
    sessionId,
    isTracking,
    addLog,
    setPendingPoints,
    setLastSentAt,
  } = useSession();

  const locationServiceRef = useRef<LocationService | null>(null);
  const syncServiceRef = useRef<SyncService | null>(null);
  const syncStatusRef = useRef<SyncStatus>('idle');

  const getLocationService = useCallback(() => {
    if (!locationServiceRef.current) {
      locationServiceRef.current = new LocationService();
    }
    return locationServiceRef.current;
  }, []);

  const getSyncService = useCallback(() => {
    if (!syncServiceRef.current) {
      syncServiceRef.current = new SyncService();
    }
    return syncServiceRef.current;
  }, []);

  useEffect(() => {
    const syncService = getSyncService();
    syncService.setSessionId(sessionId);
  }, [sessionId, getSyncService]);

  useEffect(() => {
    const syncService = getSyncService();

    syncService.setCallbacks({
      onSendSuccess: (point: LocationPoint) => {
        setLastSentAt(new Date().toISOString());
        addLog('success', `Ponto enviado: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`);
      },
      onSendError: (_point: LocationPoint, error: Error) => {
        addLog('warning', `Falha no envio, salvo offline: ${error.message}`);
      },
      onRecoveryStart: (count: number) => {
        addLog('info', `Iniciando recuperação de ${count} pontos pendentes...`);
      },
      onRecoverySuccess: (count: number) => {
        setLastSentAt(new Date().toISOString());
        addLog('success', `${count} pontos recuperados e enviados com sucesso`);
      },
      onRecoveryError: (error: Error) => {
        addLog('error', `Falha na recuperação: ${error.message}`);
      },
      onPendingCountChange: (count: number) => {
        setPendingPoints(count);
      },
      onStatusChange: (status: SyncStatus) => {
        syncStatusRef.current = status;
      },
    });

    syncService.getPendingCount().then(setPendingPoints);
  }, [getSyncService, addLog, setPendingPoints, setLastSentAt]);

  useEffect(() => {
    if (!isTracking) {
      return;
    }

    const locationService = getLocationService();
    const syncService = getSyncService();

    if (!locationService.isSupported()) {
      addLog('error', 'Geolocalização não suportada neste navegador');
      return;
    }

    const handleLocation = (point: LocationPoint) => {
      addLog('info', `Localização capturada: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`);
      syncService.handleLocationUpdate(point);
    };

    const handleError = (error: LocationError) => {
      addLog('error', `Erro de localização: ${error.message}`);
    };

    locationService.start(handleLocation, handleError);
    syncService.startRecoveryLoop();

    return () => {
      locationService.stop();
      syncService.stopRecoveryLoop();
    };
  }, [isTracking, getLocationService, getSyncService, addLog]);

  return {
    syncStatus: syncStatusRef.current,
  };
}
