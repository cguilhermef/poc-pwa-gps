import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControlPanel } from './ControlPanel';
import { SessionProvider } from '../contexts/SessionContext';

vi.mock('../hooks/useSync', () => ({
  useSync: () => ({
    syncStatus: 'idle',
    acquireWakeLock: vi.fn().mockResolvedValue(undefined),
    releaseWakeLock: vi.fn().mockResolvedValue(undefined),
  }),
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<SessionProvider>{ui}</SessionProvider>);
}

describe('ControlPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('should render start and stop buttons', () => {
    renderWithProvider(<ControlPanel />);

    expect(screen.getByRole('button', { name: /iniciar rastreamento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /parar rastreamento/i })).toBeInTheDocument();
  });

  it('should render status indicators', () => {
    renderWithProvider(<ControlPanel />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Rastreamento')).toBeInTheDocument();
    expect(screen.getByText('Pontos Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Último Envio')).toBeInTheDocument();
  });

  it('should disable start button when sessionId is empty', () => {
    renderWithProvider(<ControlPanel />);

    const startButton = screen.getByRole('button', { name: /iniciar rastreamento/i });
    expect(startButton).toBeDisabled();
  });

  it('should disable stop button when not tracking', () => {
    renderWithProvider(<ControlPanel />);

    const stopButton = screen.getByRole('button', { name: /parar rastreamento/i });
    expect(stopButton).toBeDisabled();
  });

  it('should show Online status when navigator.onLine is true', () => {
    renderWithProvider(<ControlPanel />);

    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show Parado when not tracking', () => {
    renderWithProvider(<ControlPanel />);

    expect(screen.getByText('Parado')).toBeInTheDocument();
  });

  it('should show 0 pending points initially', () => {
    renderWithProvider(<ControlPanel />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should show Nunca for last sent when no data sent', () => {
    renderWithProvider(<ControlPanel />);

    expect(screen.getByText('Nunca')).toBeInTheDocument();
  });
});
