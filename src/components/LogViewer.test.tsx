import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LogViewer } from './LogViewer';
import { SessionProvider, useSession } from '../contexts/SessionContext';

function renderWithProvider(ui: React.ReactElement) {
  return render(<SessionProvider>{ui}</SessionProvider>);
}

function LogViewerWithLogs() {
  const { addLog } = useSession();
  return (
    <>
      <button onClick={() => addLog('info', 'Test info message')}>Add Info</button>
      <button onClick={() => addLog('error', 'Test error message')}>Add Error</button>
      <LogViewer />
    </>
  );
}

describe('LogViewer', () => {
  it('should render logs header with title', () => {
    renderWithProvider(<LogViewer />);

    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('should render clear button', () => {
    renderWithProvider(<LogViewer />);

    expect(screen.getByRole('button', { name: /limpar logs/i })).toBeInTheDocument();
  });

  it('should show empty message when no logs', () => {
    renderWithProvider(<LogViewer />);

    expect(screen.getByText('Nenhum log registrado')).toBeInTheDocument();
  });

  it('should display log entries when added', () => {
    renderWithProvider(<LogViewerWithLogs />);

    act(() => {
      screen.getByText('Add Info').click();
    });

    expect(screen.getByText('Test info message')).toBeInTheDocument();
    expect(screen.getByText('[INFO]')).toBeInTheDocument();
  });

  it('should display multiple log entries', () => {
    renderWithProvider(<LogViewerWithLogs />);

    act(() => {
      screen.getByText('Add Info').click();
      screen.getByText('Add Error').click();
    });

    expect(screen.getByText('Test info message')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should clear logs when clear button is clicked', () => {
    renderWithProvider(<LogViewerWithLogs />);

    act(() => {
      screen.getByText('Add Info').click();
    });
    expect(screen.getByText('Test info message')).toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: /limpar logs/i }).click();
    });

    expect(screen.queryByText('Test info message')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum log registrado')).toBeInTheDocument();
  });

  it('should have accessible log list', () => {
    renderWithProvider(<LogViewer />);

    expect(screen.getByRole('log')).toBeInTheDocument();
  });
});
