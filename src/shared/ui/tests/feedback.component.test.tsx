import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Badge } from '../badge.component';
import { ErrorMessage } from '../error-message.component';
import { Spinner } from '../spinner.component';

describe('Badge', () => {
  it.each([
    ['default', 'bg-badge-default-bg', 'text-badge-default-fg'],
    ['primary', 'bg-badge-primary-bg', 'text-badge-primary-fg'],
    ['success', 'bg-badge-success-bg', 'text-badge-success-fg'],
    ['warning', 'bg-badge-warning-bg', 'text-badge-warning-fg'],
    ['danger', 'bg-badge-danger-bg', 'text-badge-danger-fg'],
  ] as const)('variante %s de DESIGN.md', (variant, bg, fg) => {
    render(<Badge variant={variant}>Hecha</Badge>);
    const badge = screen.getByText('Hecha');
    expect(badge.className).toContain(bg);
    expect(badge.className).toContain(fg);
    expect(badge.className).toContain('rounded-full');
    expect(badge.className).toContain('text-caption');
  });

  it('variante outline para identificadores', () => {
    render(<Badge variant="outline">#UI007</Badge>);
    expect(screen.getByText('#UI007').className).toContain('border-border');
  });
});

describe('RF-40: Spinner', () => {
  it('anuncia la carga sin bloquear y gira con el token anim-spin', () => {
    render(<Spinner />);
    const status = screen.getByRole('status', { name: 'Cargando…' });
    expect(status.querySelector('svg')?.getAttribute('class')).toContain('animate-spin');
  });

  it('acepta un texto propio', () => {
    render(<Spinner label="Cargando tareas…" />);
    expect(screen.getByRole('status', { name: 'Cargando tareas…' })).toBeInTheDocument();
  });
});

describe('RF-41 y RF-44: ErrorMessage', () => {
  it('muestra el mensaje como alerta', () => {
    render(<ErrorMessage message="No hay conexión con el servidor." />);
    expect(screen.getByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
  });

  it('sin onRetry no ofrece reintentar', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('RF-44: con onRetry ofrece «Reintentar», también con teclado', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
