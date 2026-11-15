import { render, screen } from '@testing-library/react';

import { Countdown } from '../countdown.component';

describe('Countdown', () => {
  it('RF-15: muestra el tiempo restante en MM:SS con su nombre para el lector de pantalla', () => {
    render(<Countdown seconds={754} paused={false} />);
    const clock = screen.getByText('12:34');
    expect(clock).toHaveTextContent('Tiempo restante: 12:34');
    expect(clock.className).toContain('tabular-nums');
  });

  it('RF-16 y RNF-02: en pausa se atenúa y no es una región viva', () => {
    render(<Countdown seconds={60} paused />);
    const clock = screen.getByText('01:00');
    expect(clock.className).toContain('text-foreground-muted');
    expect(clock.closest('[aria-live]')).toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
