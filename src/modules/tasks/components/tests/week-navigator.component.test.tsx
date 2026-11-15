import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WeekNavigator } from '../week-navigator.component';

function setup() {
  const handlers = { onPrevious: jest.fn(), onNext: jest.fn(), onToday: jest.fn() };
  render(<WeekNavigator weekStart="2026-10-29" weekEnd="2026-11-04" {...handlers} />);
  return handlers;
}

describe('WeekNavigator', () => {
  it('muestra el rango de la semana y lo anuncia al cambiar', () => {
    setup();
    const range = screen.getByText('29/10/2026 – 04/11/2026');
    expect(range).toHaveAttribute('aria-live', 'polite');
  });

  it('RF-12 y RF-47: retroceder, «Hoy» y avanzar llaman a su acción', async () => {
    const user = userEvent.setup();
    const handlers = setup();
    await user.click(screen.getByRole('button', { name: 'Semana anterior' }));
    await user.click(screen.getByRole('button', { name: 'Hoy' }));
    await user.click(screen.getByRole('button', { name: 'Semana siguiente' }));
    expect(handlers.onPrevious).toHaveBeenCalledTimes(1);
    expect(handlers.onToday).toHaveBeenCalledTimes(1);
    expect(handlers.onNext).toHaveBeenCalledTimes(1);
  });

  it('RNF-02: se usa solo con teclado', async () => {
    const user = userEvent.setup();
    const handlers = setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Semana anterior' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.keyboard(' ');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(handlers.onPrevious).toHaveBeenCalledTimes(1);
    expect(handlers.onToday).toHaveBeenCalledTimes(1);
    expect(handlers.onNext).toHaveBeenCalledTimes(1);
  });
});
