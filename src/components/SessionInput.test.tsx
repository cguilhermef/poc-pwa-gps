import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionInput } from './SessionInput';
import { SessionProvider } from '../contexts/SessionContext';

function renderWithProvider(ui: React.ReactElement) {
  return render(<SessionProvider>{ui}</SessionProvider>);
}

describe('SessionInput', () => {
  it('should render input with label', () => {
    renderWithProvider(<SessionInput />);

    expect(screen.getByLabelText('Session ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite o ID da sessão')).toBeInTheDocument();
  });

  it('should update value when typing', () => {
    renderWithProvider(<SessionInput />);

    const input = screen.getByLabelText('Session ID') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'my-session' } });

    expect(input.value).toBe('my-session');
  });

  it('should show hint text when not tracking', () => {
    renderWithProvider(<SessionInput />);

    expect(screen.getByText('Obrigatório para iniciar o rastreamento')).toBeInTheDocument();
  });

  it('should be enabled when not tracking', () => {
    renderWithProvider(<SessionInput />);

    const input = screen.getByLabelText('Session ID');
    expect(input).not.toBeDisabled();
  });
});
