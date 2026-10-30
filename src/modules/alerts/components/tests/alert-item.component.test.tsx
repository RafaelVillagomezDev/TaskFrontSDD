import { render, screen, within } from '@testing-library/react';

import type { Alert } from '../../schemas/alert.schema';
import { AlertItem } from '../alert-item.component';

const WEEKLY: Alert = {
  id: 'al1',
  type: 'weekly',
  periodStart: '2026-10-23',
  periodEnd: '2026-10-25',
  tasks: [
    { id: 't1', title: 'Llamar al banco', date: '2026-10-23' },
    { id: 't2', title: 'Pagar el alquiler', date: '2026-10-25' },
  ],
  createdAt: new Date(2026, 9, 23, 22, 0).toISOString(),
};

function renderItem(alert: Alert) {
  render(
    <ul>
      <AlertItem alert={alert} />
    </ul>,
  );
  return screen.getAllByRole('listitem')[0] ?? document.body;
}

describe('AlertItem', () => {
  it('RF-35: muestra el tipo, el periodo, cuándo se generó y el número de tareas', () => {
    const item = renderItem(WEEKLY);
    expect(item).toHaveTextContent('Semanal');
    expect(within(item).getByRole('heading', { level: 2 })).toHaveTextContent('Del 23/10/2026 al 25/10/2026');
    expect(item).toHaveTextContent('Generado el 23/10/2026 a las 22:00');
    expect(item).toHaveTextContent('2 tareas');
  });

  it('RF-35: un aviso diario muestra su día', () => {
    const item = renderItem({ ...WEEKLY, type: 'daily', periodStart: '2026-10-29', periodEnd: '2026-10-29' });
    expect(item).toHaveTextContent('Diario');
    expect(within(item).getByRole('heading', { level: 2 })).toHaveTextContent('jueves, 29 de octubre de 2026');
  });

  it('RF-36: lista las tareas con su fecha tal como estaban y avisa de que pueden haber cambiado', () => {
    const item = renderItem(WEEKLY);
    const tasks = within(item).getByRole('list', { name: 'Tareas pendientes al generarse' });
    const rows = within(tasks).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Llamar al banco');
    expect(rows[0]).toHaveTextContent('23/10/2026');
    expect(item).toHaveTextContent(
      'Así estaban al generarse el aviso: puede que las hayas completado o cambiado desde entonces.',
    );
  });

  it('un aviso mensual con una sola tarea concuerda en singular', () => {
    const item = renderItem({ ...WEEKLY, type: 'monthly', tasks: [{ id: 't1', title: 'X', date: '2026-10-29' }] });
    expect(item).toHaveTextContent('Mensual');
    expect(item).toHaveTextContent('1 tarea');
  });
});
