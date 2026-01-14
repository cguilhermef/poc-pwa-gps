/**
 * Tipos compartilhados para a API
 * Duplicado de src/types para evitar problemas de importação cross-directory no Vercel
 */

export interface LocationPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  isOfflineBuffer: boolean;
}

export interface TrackPayload {
  sessionId: string;
  points: LocationPoint[];
}

export interface TrackingPointRecord {
  id: string;
  session_id: string;
  recorded_at: string;
  received_at: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  metadata: {
    speed?: number | null;
    heading?: number | null;
    isOfflineBuffer?: boolean;
    [key: string]: unknown;
  };
}

export type TrackingPointInsert = Omit<TrackingPointRecord, 'id' | 'received_at'>;
