import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SessionProvider, useSession } from './SessionContext';

function TestConsumer() {
  const {
    sessionId,
    isTracking,
    isOnline,
    pendingPoints,
    lastSentAt,
    logs,
    setSessionId,
    startTracking,
    stopTracking,
    setOnlineStatus,
    setPendingPoints,
    setLastSentAt,
    addLog,
    clearLogs,
  } = useSession();

  return (
    <div>
      <span data-testid="sessionId">{sessionId}</span>
      <span data-testid="isTracking">{String(isTracking)}</span>
      <span data-testid="isOnline">{String(isOnline)}</span>
      <span data-testid="pendingPoints">{pendingPoints}</span>
      <span data-testid="lastSentAt">{lastSentAt ?? 'null'}</span>
      <span data-testid="logsCount">{logs.length}</span>
      <button onClick={() => setSessionId('test-session')}>setSessionId</button>
      <button onClick={startTracking}>startTracking</button>
      <button onClick={stopTracking}>stopTracking</button>
      <button onClick={() => setOnlineStatus(false)}>setOffline</button>
      <button onClick={() => setPendingPoints(5)}>setPendingPoints</button>
      <button onClick={() => setLastSentAt('2024-01-01T00:00:00Z')}>setLastSentAt</button>
      <button onClick={() => addLog('info', 'Test log')}>addLog</button>
      <button onClick={clearLogs}>clearLogs</button>
    </div>
  );
}

describe('SessionContext', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('should provide initial state', () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    expect(screen.getByTestId('sessionId').textContent).toBe('');
    expect(screen.getByTestId('isTracking').textContent).toBe('false');
    expect(screen.getByTestId('isOnline').textContent).toBe('true');
    expect(screen.getByTestId('pendingPoints').textContent).toBe('0');
    expect(screen.getByTestId('lastSentAt').textContent).toBe('null');
    expect(screen.getByTestId('logsCount').textContent).toBe('0');
  });

  it('should update sessionId', () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    act(() => {
      screen.getByText('setSessionId').click();
    });

    expect(screen.getByTestId('sessionId').textContent).toBe('test-session');
  });

  it('should start and stop tracking', () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    act(() => {
      screen.getByText('startTracking').click();
    });
    expect(screen.getByTestId('isTracking').textContent).toBe('true');

    act(() => {
      screen.getByText('stopTracking').click();
    });
    expect(screen.getByTestId('isTracking').textContent).toBe('false');
  });

  it('should update online status', () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    act(() => {
      screen.getByText('setOffline').click();
    });

    expect(screen.getByTestId('isOnline').textContent).toBe('false');
  });

  it('should update pending points', () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    act(() => {
      screen.getByText('setPendingPoints').click();
    });

    expect(screen.getByTestId('pendingPoints').textContent).toBe('5');
  });

  it('should update lastSentAt', () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    act(() => {
      screen.getByText('setLastSentAt').click();
    });

    expect(screen.getByTestId('lastSentAt').textContent).toBe('2024-01-01T00:00:00Z');
  });

  it('should add and clear logs', () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    act(() => {
      screen.getByText('addLog').click();
    });
    expect(screen.getByTestId('logsCount').textContent).toBe('1');

    act(() => {
      screen.getByText('addLog').click();
    });
    expect(screen.getByTestId('logsCount').textContent).toBe('2');

    act(() => {
      screen.getByText('clearLogs').click();
    });
    expect(screen.getByTestId('logsCount').textContent).toBe('0');
  });

  it('should throw error when useSession is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestConsumer />)).toThrow(
      'useSession must be used within a SessionProvider'
    );

    consoleError.mockRestore();
  });
});
