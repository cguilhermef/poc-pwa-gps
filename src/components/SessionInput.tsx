import { useSession } from '../contexts/SessionContext';
import styles from './SessionInput.module.css';

export function SessionInput() {
  const { sessionId, setSessionId, isTracking } = useSession();

  return (
    <div className={styles.container}>
      <label htmlFor="session-id" className={styles.label}>
        Session ID
      </label>
      <input
        id="session-id"
        type="text"
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        disabled={isTracking}
        placeholder="Digite o ID da sessão"
        className={styles.input}
        aria-describedby="session-id-hint"
      />
      <span id="session-id-hint" className={styles.hint}>
        {isTracking
          ? 'Pare o rastreamento para alterar a sessão'
          : 'Obrigatório para iniciar o rastreamento'}
      </span>
    </div>
  );
}
