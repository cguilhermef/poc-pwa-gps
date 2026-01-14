import { useEffect, useRef } from 'react';
import { useSession } from '../contexts/SessionContext';
import type { LogEntry } from '../contexts/SessionContext';
import styles from './LogViewer.module.css';

function LogItem({ entry }: { entry: LogEntry }) {
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`${styles.logItem} ${styles[entry.level]}`} role="listitem">
      <span className={styles.timestamp}>{formatTime(entry.timestamp)}</span>
      <span className={styles.level}>[{entry.level.toUpperCase()}]</span>
      <span className={styles.message}>{entry.message}</span>
    </div>
  );
}

export function LogViewer() {
  const { logs, clearLogs } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Logs</h2>
        <button
          onClick={clearLogs}
          className={styles.clearButton}
          aria-label="Limpar logs"
        >
          Limpar
        </button>
      </div>
      <div
        ref={containerRef}
        className={styles.logList}
        role="log"
        aria-live="polite"
        aria-label="Lista de logs do sistema"
      >
        {logs.length === 0 ? (
          <p className={styles.emptyMessage}>Nenhum log registrado</p>
        ) : (
          logs.map((entry) => <LogItem key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
