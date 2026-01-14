import { useSession } from '../contexts/SessionContext';
import { useSync } from '../hooks/useSync';
import styles from './ControlPanel.module.css';

export function ControlPanel() {
  const {
    sessionId,
    isTracking,
    isOnline,
    pendingPoints,
    lastSentAt,
    startTracking,
    stopTracking,
    addLog,
  } = useSession();

  const { acquireWakeLock } = useSync();

  const canStart = sessionId.trim().length > 0 && !isTracking;

  const handleStart = async () => {
    if (!canStart) return;
    await acquireWakeLock();
    startTracking();
    addLog('info', `Rastreamento iniciado para sessão: ${sessionId}`);
  };

  const handleStop = () => {
    if (!isTracking) return;
    stopTracking();
    addLog('info', 'Rastreamento parado');
  };

  const formatLastSent = (timestamp: string | null): string => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`${styles.button} ${styles.startButton}`}
          aria-label="Iniciar rastreamento"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!isTracking}
          className={`${styles.button} ${styles.stopButton}`}
          aria-label="Parar rastreamento"
        >
          Stop
        </button>
      </div>

      <div className={styles.statusPanel}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Status</span>
          <span
            className={`${styles.statusValue} ${isOnline ? styles.online : styles.offline}`}
            role="status"
            aria-live="polite"
          >
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Rastreamento</span>
          <span
            className={`${styles.statusValue} ${isTracking ? styles.tracking : ''}`}
            role="status"
            aria-live="polite"
          >
            {isTracking ? 'Ativo' : 'Parado'}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Pontos Pendentes</span>
          <span className={styles.statusValue} aria-live="polite">
            {pendingPoints}
          </span>
        </div>

        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>Último Envio</span>
          <span className={styles.statusValue}>
            {formatLastSent(lastSentAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
