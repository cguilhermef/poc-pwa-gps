import { openDB, type IDBPDatabase } from 'idb';
import type { LocationPoint } from '../types';

const DB_NAME = 'wimt-offline-storage';
const DB_VERSION = 1;
const STORE_NAME = 'pending-points';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface StoredPoint extends LocationPoint {
  id: string;
  storedAt: string; // ISO 8601 UTC - when the point was stored locally
}

interface WimtDB {
  [STORE_NAME]: {
    key: string;
    value: StoredPoint;
    indexes: { 'by-timestamp': string };
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class StorageService {
  private dbPromise: Promise<IDBPDatabase<WimtDB>> | null = null;
  private indexedDB: IDBFactory | undefined;

  constructor(indexedDB?: IDBFactory | null) {
    if (arguments.length > 0) {
      this.indexedDB = indexedDB ?? undefined;
    } else {
      this.indexedDB = typeof window !== 'undefined' ? window.indexedDB : undefined;
    }
  }

  isSupported(): boolean {
    return this.indexedDB != null;
  }

  private async getDb(): Promise<IDBPDatabase<WimtDB>> {
    if (!this.isSupported()) {
      throw new Error('IndexedDB is not supported in this environment');
    }

    if (!this.dbPromise) {
      this.dbPromise = openDB<WimtDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by-timestamp', 'timestamp');
          }
        },
      });
    }

    return this.dbPromise;
  }

  async savePoint(point: LocationPoint): Promise<string> {
    const db = await this.getDb();
    
    const storedPoint: StoredPoint = {
      ...point,
      id: generateId(),
      storedAt: new Date().toISOString(),
      isOfflineBuffer: true,
    };

    await db.put(STORE_NAME, storedPoint);
    return storedPoint.id;
  }

  async getPendingPoints(limit: number): Promise<StoredPoint[]> {
    const db = await this.getDb();
    
    const allPoints = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
    
    const now = Date.now();
    const validPoints: StoredPoint[] = [];
    const expiredIds: string[] = [];

    for (const point of allPoints) {
      const storedTime = new Date(point.storedAt).getTime();
      const age = now - storedTime;

      if (age > MAX_AGE_MS) {
        expiredIds.push(point.id);
      } else {
        validPoints.push(point);
      }
    }

    if (expiredIds.length > 0) {
      await this.removePoints(expiredIds);
      console.warn(`[StorageService] Discarded ${expiredIds.length} expired points (>24h)`);
    }

    return validPoints.slice(0, limit);
  }

  async removePoints(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const db = await this.getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    
    await Promise.all([
      ...ids.map(id => tx.store.delete(id)),
      tx.done,
    ]);
  }

  async size(): Promise<number> {
    const db = await this.getDb();
    return db.count(STORE_NAME);
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.clear(STORE_NAME);
  }

  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }
}

export const storageService = new StorageService();
