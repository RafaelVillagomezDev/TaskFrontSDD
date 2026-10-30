import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import type { useStreakPanel } from '../../hooks/use-streak-panel.hook';
import { StreakPanel } from '../streak-panel.component';

type Panel = ReturnType<typeof useStreakPanel>;

function panel(change: Partial<Panel> = {}): Panel {
  return {
    status: 'ready',
    streak: { current: 4, best: 9 },
    progress: { done: 1, total: 3 },
    errorMessage: undefined,
    hasNoTasksToday: false,
    atRisk: false,
    retry: jest.fn(),
    ...change,
  };
}

function renderPanel(model: Panel, onCreateTask = jest.fn()) {
  render(<StreakPanel panel={model} onCreateTask={onCreateTask} />);
  return screen.getByRole('region', { name: 'Racha y progreso de hoy' });
}

function valueOf(region: HTMLElement, label: string): string | null | undefined {
  return within(region).getByText(label).nextElementSibling?.textContent;
}

describe('StreakPanel', () => {
  it('RF-25 y RF-26: muestra la racha actual, la mejor y «X de Y tareas completadas»', () => {
    const region = renderPanel(panel());
    expect(valueOf(region, 'Racha actual')).toBe('4 días');
    expect(valueOf(region, 'Mejor racha')).toBe('9 días');
    expect(valueOf(region, 'Hoy')).toBe('1 de 3 tareas completadas');
    expect(within(region).queryByText('Tu racha está en juego')).not.toBeInTheDocument();
  });

  it('RF-25: con racha 0 y en singular', () => {
    const region = renderPanel(panel({ streak: { current: 0, best: 1 } }));
    expect(valueOf(region, 'Racha actual')).toBe('0 días');
    expect(valueOf(region, 'Mejor racha')).toBe('1 día');
  });

  it('RF-27: avisa de que la racha está en juego y de que se pierde si hoy termina sin completar ninguna', () => {
    const region = renderPanel(panel({ progress: { done: 0, total: 2 }, atRisk: true }));
    const notice = within(region).getByRole('status');
    expect(notice).toHaveTextContent('Tu racha está en juego');
    expect(notice).toHaveTextContent('Si hoy termina sin ninguna tarea completada, la perderás.');
  });

  it('RF-28: sin tareas hoy muestra «Sin tareas hoy» y la opción de crear una', () => {
    const onCreateTask = jest.fn();
    const region = renderPanel(panel({ progress: { done: 0, total: 0 }, hasNoTasksToday: true }), onCreateTask);
    expect(within(region).getByText('Sin tareas hoy')).toBeInTheDocument();
    within(region).getByRole('button', { name: 'Crear una tarea' }).click();
    expect(onCreateTask).toHaveBeenCalledTimes(1);
  });

  it('RF-40: mientras cargan, la racha y el progreso muestran su indicador', () => {
    const region = renderPanel(panel({ status: 'loading', streak: undefined, progress: undefined }));
    expect(within(region).getAllByRole('status', { name: 'Cargando…' })).toHaveLength(3);
  });

  it('RF-44: si la racha falla, muestra el error con reintento y mantiene el progreso', () => {
    const retry = jest.fn();
    const region = renderPanel(panel({ status: 'error', streak: undefined, errorMessage: 'Algo ha fallado.', retry }));
    expect(within(region).getByRole('alert')).toHaveTextContent('Algo ha fallado.');
    within(region).getByRole('button', { name: 'Reintentar' }).click();
    expect(retry).toHaveBeenCalledTimes(1);
    expect(within(region).queryByText('Racha actual')).not.toBeInTheDocument();
    expect(valueOf(region, 'Hoy')).toBe('1 de 3 tareas completadas');
  });
});
