import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import type { Alert } from '../../schemas/alert.schema';
import { TodaysAlertBanner } from '../todays-alert-banner.component';

const ALERT: Alert = {
  id: 'al1',
  type: 'monthly',
  periodStart: '2026-10-29',
  periodEnd: '2026-10-31',
  tasks: [
    { id: 't1', title: 'Llamar al banco', date: '2026-10-29' },
    { id: 't2', title: 'Pagar el alquiler', date: '2026-10-31' },
  ],
  createdAt: '2026-10-29T21:00:00Z',
};

describe('TodaysAlertBanner', () => {
  it('RF-37: muestra el tipo, el número de tareas y el acceso a los avisos', () => {
    render(
      <MemoryRouter>
        <TodaysAlertBanner alert={ALERT} />
      </MemoryRouter>,
    );
    const banner = screen.getByRole('region', { name: 'Aviso de hoy' });
    expect(banner).toHaveTextContent('Aviso mensual de hoy');
    expect(banner).toHaveTextContent('2 tareas pendientes');
    const link = within(banner).getByRole('link', { name: 'Ver aviso' });
    expect(link).toHaveAttribute('href', '/alerts');
    expect(link.className).toContain('min-h-touch');
  });

  it('RF-37: con una sola tarea concuerda en singular', () => {
    render(
      <MemoryRouter>
        <TodaysAlertBanner alert={{ ...ALERT, type: 'daily', tasks: [{ id: 't1', title: 'X', date: '2026-10-29' }] }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('region')).toHaveTextContent('Aviso diario de hoy');
    expect(screen.getByRole('region')).toHaveTextContent('1 tarea pendiente');
  });
});
