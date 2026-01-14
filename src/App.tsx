import { useEffect } from 'react';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { SessionInput, ControlPanel, LogViewer } from './components';
import './App.css';

function AppContent() {
  const { setOnlineStatus, addLog } = useSession();

  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      addLog('success', 'Conexão restabelecida');
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      addLog('warning', 'Conexão perdida - modo offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, addLog]);

  return (
    <main className="app-container">
      <header className="app-header">
        <h1 className="app-title">WIMT Tracker</h1>
        <p className="app-subtitle">PoC PWA Rastreamento de Localização</p>
      </header>

      <section className="app-section" aria-label="Configuração de sessão">
        <SessionInput />
      </section>

      <section className="app-section" aria-label="Controles de rastreamento">
        <ControlPanel />
      </section>

      <section className="app-section app-logs" aria-label="Logs do sistema">
        <LogViewer />
      </section>
    </main>
  );
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App
