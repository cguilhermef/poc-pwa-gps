import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export type { LogEntry };

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

interface SessionState {
  sessionId: string;
  isTracking: boolean;
  isOnline: boolean;
  pendingPoints: number;
  lastSentAt: string | null;
  logs: LogEntry[];
}

interface SessionContextValue extends SessionState {
  setSessionId: (id: string) => void;
  startTracking: () => void;
  stopTracking: () => void;
  setOnlineStatus: (online: boolean) => void;
  setPendingPoints: (count: number) => void;
  setLastSentAt: (timestamp: string | null) => void;
  addLog: (level: LogLevel, message: string) => void;
  clearLogs: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [state, setState] = useState<SessionState>({
    sessionId: '',
    isTracking: false,
    isOnline: navigator.onLine,
    pendingPoints: 0,
    lastSentAt: null,
    logs: [],
  });

  const setSessionId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, sessionId: id }));
  }, []);

  const startTracking = useCallback(() => {
    setState((prev) => ({ ...prev, isTracking: true }));
  }, []);

  const stopTracking = useCallback(() => {
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  const setOnlineStatus = useCallback((online: boolean) => {
    setState((prev) => ({ ...prev, isOnline: online }));
  }, []);

  const setPendingPoints = useCallback((count: number) => {
    setState((prev) => ({ ...prev, pendingPoints: count }));
  }, []);

  const setLastSentAt = useCallback((timestamp: string | null) => {
    setState((prev) => ({ ...prev, lastSentAt: timestamp }));
  }, []);

  const addLog = useCallback((level: LogLevel, message: string) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, entry],
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setState((prev) => ({ ...prev, logs: [] }));
  }, []);

  const value: SessionContextValue = {
    ...state,
    setSessionId,
    startTracking,
    stopTracking,
    setOnlineStatus,
    setPendingPoints,
    setLastSentAt,
    addLog,
    clearLogs,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
