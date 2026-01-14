import Router from '@koa/router';
import { getSupabaseClient } from './lib/supabase.js';
import type { TrackPayload, LocationPoint, TrackingPointInsert } from '../src/types.js';

const router = new Router();

router.get('/api/status', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

function isValidLocationPoint(point: unknown): point is LocationPoint {
  if (typeof point !== 'object' || point === null) return false;
  const p = point as Record<string, unknown>;
  return (
    typeof p.timestamp === 'string' &&
    typeof p.latitude === 'number' &&
    typeof p.longitude === 'number' &&
    (p.accuracy === null || typeof p.accuracy === 'number') &&
    (p.heading === null || typeof p.heading === 'number') &&
    (p.speed === null || typeof p.speed === 'number') &&
    typeof p.isOfflineBuffer === 'boolean'
  );
}

function isValidTrackPayload(body: unknown): body is TrackPayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.sessionId !== 'string' || b.sessionId.trim() === '') return false;
  if (!Array.isArray(b.points) || b.points.length === 0) return false;
  return b.points.every(isValidLocationPoint);
}

router.post('/api/track', async (ctx) => {
  const body = ctx.request.body;

  if (!isValidTrackPayload(body)) {
    ctx.status = 400;
    ctx.body = {
      error: 'Invalid payload',
      message: 'Expected { sessionId: string, points: LocationPoint[] }',
    };
    return;
  }

  const { sessionId, points } = body;

  const records: TrackingPointInsert[] = points.map((point) => ({
    session_id: sessionId,
    recorded_at: point.timestamp,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: point.accuracy,
    metadata: {
      speed: point.speed,
      heading: point.heading,
      isOfflineBuffer: point.isOfflineBuffer,
    },
  }));

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tracking_points')
    .insert(records)
    .select('id');

  if (error) {
    console.error('Supabase insert error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Database error', message: error.message };
    return;
  }

  ctx.status = 200;
  ctx.body = {
    success: true,
    inserted: data?.length ?? 0,
    sessionId,
  };
});

router.get('/api/tracks/:sessionId', async (ctx) => {
  const { sessionId } = ctx.params;

  if (!sessionId || sessionId.trim() === '') {
    ctx.status = 400;
    ctx.body = { error: 'Invalid sessionId' };
    return;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tracking_points')
    .select('*')
    .eq('session_id', sessionId)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Supabase query error:', error);
    ctx.status = 500;
    ctx.body = { error: 'Database error', message: error.message };
    return;
  }

  const points: LocationPoint[] = (data ?? []).map((record) => ({
    timestamp: record.recorded_at,
    latitude: record.latitude,
    longitude: record.longitude,
    accuracy: record.accuracy,
    heading: record.metadata?.heading ?? null,
    speed: record.metadata?.speed ?? null,
    isOfflineBuffer: record.metadata?.isOfflineBuffer ?? false,
  }));

  ctx.status = 200;
  ctx.body = {
    sessionId,
    points,
  };
});

export default router;
