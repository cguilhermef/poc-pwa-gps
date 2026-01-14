import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}));

import router from './routes';
import { getSupabaseClient } from './lib/supabase';

function createMockContext(options: {
  method?: string;
  path?: string;
  body?: unknown;
  params?: Record<string, string>;
} = {}) {
  const ctx = {
    method: options.method ?? 'GET',
    path: options.path ?? '/',
    request: {
      body: options.body,
    },
    params: options.params ?? {},
    status: 200,
    body: undefined as unknown,
  };
  return ctx;
}

async function executeRoute(
  method: string,
  path: string,
  ctx: ReturnType<typeof createMockContext>
) {
  const layer = router.stack.find(
    (l) => l.methods.includes(method) && l.regexp.test(path)
  );
  if (!layer) throw new Error(`Route not found: ${method} ${path}`);

  const match = layer.regexp.exec(path);
  if (match && layer.paramNames.length > 0) {
    layer.paramNames.forEach((param, index) => {
      ctx.params[param.name] = match[index + 1];
    });
  }

  await layer.stack[0](ctx, async () => {});
  return ctx;
}

describe('GET /api/status', () => {
  it('should return status ok with timestamp', async () => {
    const ctx = createMockContext({ method: 'GET', path: '/api/status' });
    await executeRoute('GET', '/api/status', ctx);

    expect(ctx.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });
});

describe('POST /api/track', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase as never);
  });

  const validPayload = {
    sessionId: 'test-session-123',
    points: [
      {
        timestamp: '2024-01-15T10:30:00.000Z',
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 10,
        heading: null,
        speed: null,
        isOfflineBuffer: false,
      },
    ],
  };

  it('should reject invalid payload - missing sessionId', async () => {
    const ctx = createMockContext({
      method: 'POST',
      path: '/api/track',
      body: { points: [] },
    });
    await executeRoute('POST', '/api/track', ctx);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      error: 'Invalid payload',
      message: 'Expected { sessionId: string, points: LocationPoint[] }',
    });
  });

  it('should reject invalid payload - empty points array', async () => {
    const ctx = createMockContext({
      method: 'POST',
      path: '/api/track',
      body: { sessionId: 'test', points: [] },
    });
    await executeRoute('POST', '/api/track', ctx);

    expect(ctx.status).toBe(400);
  });

  it('should reject invalid payload - invalid point structure', async () => {
    const ctx = createMockContext({
      method: 'POST',
      path: '/api/track',
      body: {
        sessionId: 'test',
        points: [{ latitude: 10 }],
      },
    });
    await executeRoute('POST', '/api/track', ctx);

    expect(ctx.status).toBe(400);
  });

  it('should insert valid points and return success', async () => {
    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1' }],
      error: null,
    });

    const ctx = createMockContext({
      method: 'POST',
      path: '/api/track',
      body: validPayload,
    });
    await executeRoute('POST', '/api/track', ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({
      success: true,
      inserted: 1,
      sessionId: 'test-session-123',
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('tracking_points');
    expect(mockSupabase.insert).toHaveBeenCalledWith([
      {
        session_id: 'test-session-123',
        recorded_at: '2024-01-15T10:30:00.000Z',
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 10,
        metadata: {
          speed: null,
          heading: null,
          isOfflineBuffer: false,
        },
      },
    ]);
  });

  it('should handle database errors', async () => {
    mockSupabase.select.mockResolvedValue({
      data: null,
      error: { message: 'Connection failed' },
    });

    const ctx = createMockContext({
      method: 'POST',
      path: '/api/track',
      body: validPayload,
    });
    await executeRoute('POST', '/api/track', ctx);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toEqual({
      error: 'Database error',
      message: 'Connection failed',
    });
  });

  it('should handle batch insert (multiple points)', async () => {
    const batchPayload = {
      sessionId: 'batch-session',
      points: [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          latitude: -23.5505,
          longitude: -46.6333,
          accuracy: 10,
          heading: 90,
          speed: 5.5,
          isOfflineBuffer: true,
        },
        {
          timestamp: '2024-01-15T10:30:30.000Z',
          latitude: -23.5510,
          longitude: -46.6340,
          accuracy: 15,
          heading: null,
          speed: null,
          isOfflineBuffer: true,
        },
      ],
    };

    mockSupabase.select.mockResolvedValue({
      data: [{ id: 'uuid-1' }, { id: 'uuid-2' }],
      error: null,
    });

    const ctx = createMockContext({
      method: 'POST',
      path: '/api/track',
      body: batchPayload,
    });
    await executeRoute('POST', '/api/track', ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({
      success: true,
      inserted: 2,
      sessionId: 'batch-session',
    });
  });
});

describe('GET /api/tracks/:sessionId', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase as never);
  });

  it('should return points for a valid sessionId', async () => {
    const mockData = [
      {
        id: 'uuid-1',
        session_id: 'test-session',
        recorded_at: '2024-01-15T10:30:00.000Z',
        received_at: '2024-01-15T10:30:01.000Z',
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 10,
        metadata: { speed: 5, heading: 90, isOfflineBuffer: false },
      },
    ];

    mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

    const ctx = createMockContext({
      method: 'GET',
      path: '/api/tracks/test-session',
    });
    await executeRoute('GET', '/api/tracks/test-session', ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({
      sessionId: 'test-session',
      points: [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          latitude: -23.5505,
          longitude: -46.6333,
          accuracy: 10,
          heading: 90,
          speed: 5,
          isOfflineBuffer: false,
        },
      ],
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('tracking_points');
    expect(mockSupabase.eq).toHaveBeenCalledWith('session_id', 'test-session');
    expect(mockSupabase.order).toHaveBeenCalledWith('recorded_at', { ascending: true });
  });

  it('should return empty array for session with no points', async () => {
    mockSupabase.order.mockResolvedValue({ data: [], error: null });

    const ctx = createMockContext({
      method: 'GET',
      path: '/api/tracks/empty-session',
    });
    await executeRoute('GET', '/api/tracks/empty-session', ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({
      sessionId: 'empty-session',
      points: [],
    });
  });

  it('should handle database errors', async () => {
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: { message: 'Query failed' },
    });

    const ctx = createMockContext({
      method: 'GET',
      path: '/api/tracks/test-session',
    });
    await executeRoute('GET', '/api/tracks/test-session', ctx);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toEqual({
      error: 'Database error',
      message: 'Query failed',
    });
  });

  it('should handle missing metadata gracefully', async () => {
    const mockData = [
      {
        id: 'uuid-1',
        session_id: 'test-session',
        recorded_at: '2024-01-15T10:30:00.000Z',
        received_at: '2024-01-15T10:30:01.000Z',
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: null,
        metadata: null,
      },
    ];

    mockSupabase.order.mockResolvedValue({ data: mockData, error: null });

    const ctx = createMockContext({
      method: 'GET',
      path: '/api/tracks/test-session',
    });
    await executeRoute('GET', '/api/tracks/test-session', ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({
      sessionId: 'test-session',
      points: [
        {
          timestamp: '2024-01-15T10:30:00.000Z',
          latitude: -23.5505,
          longitude: -46.6333,
          accuracy: null,
          heading: null,
          speed: null,
          isOfflineBuffer: false,
        },
      ],
    });
  });
});
