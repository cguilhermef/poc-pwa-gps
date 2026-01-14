/**
 * Tipos compartilhados para o PoC PWA Rastreamento de Localização
 * Usados tanto pelo Frontend quanto pelo Backend
 */

/**
 * Modelo de Ponto de Localização
 * Representa um ponto GPS capturado pelo dispositivo
 */
export interface LocationPoint {
  timestamp: string;        // ISO 8601 UTC
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  isOfflineBuffer: boolean; // Flag indicando se foi recuperado do buffer offline
}

/**
 * Payload de Envio para a API
 * Suporta envio unitário (1 ponto) ou em lote (N pontos)
 */
export interface TrackPayload {
  sessionId: string;        // Identificador informado pelo usuário
  points: LocationPoint[];  // Array contendo 1 (realtime) ou N (batch recovery) pontos
}

/**
 * Interface da Fila Local (IndexedDB)
 * Gerencia pontos pendentes de envio
 */
export interface OfflineQueue {
  enqueue(point: LocationPoint): Promise<void>;
  peekBatch(size: number): Promise<LocationPoint[]>;
  removeBatch(points: LocationPoint[]): Promise<void>;
  size(): Promise<number>;
}

/**
 * Registro de ponto no banco de dados (Supabase)
 * Representa a estrutura da tabela tracking_points
 */
export interface TrackingPointRecord {
  id: string;               // UUID
  session_id: string;
  recorded_at: string;      // ISO 8601 UTC
  received_at: string;      // ISO 8601 UTC
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

/**
 * Resposta da API para GET /api/tracks/:sessionId
 */
export interface TracksResponse {
  sessionId: string;
  points: LocationPoint[];
}

/**
 * Tipo para inserção no Supabase (sem id e received_at que são gerados automaticamente)
 */
export type TrackingPointInsert = Omit<TrackingPointRecord, 'id' | 'received_at'>;
