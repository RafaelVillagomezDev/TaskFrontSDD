import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import type { History } from '../../hooks/use-history.hook';
import type { Task } from '../../schemas/task.schema';
import { HistoryList } from '../history-list.component';

function task(id: string, date: string, completed = false): Task {
  return {
    id,
    title: `Tarea ${id}`,
    description: null,
    date,
    completed,
    createdAt: '2026-10-29T09:15:00Z',
    updatedAt: '2026-10-29T09:15:00Z',
  };
}

function history(change: Partial<History> = {}): History {
  const base: Partial<History> = {
    status: 'ready',
    tasks: [task('a', '2026-10-28', true), task('b', '2026-10-29')],
    page: 1,
    totalPages: 1,
    totalItems: 2,
    isFiltered: false,
    goToPage: jest.fn(),
    retry: jest.fn(),
    errorMessage: undefined,
  };
  return { ...base, ...change } as History;
}

describe('HistoryList', () => {
  it('RF-31: cada tarea con su fecha y su estado, en el orden recibido', () => {
    render(<HistoryList history={history()} />);
    const items = within(screen.getByRole('list', { name: 'Tareas del historial' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Tarea a');
    expect(items[0]).toHaveTextContent('miércoles, 28 de octubre de 2026');
    expect(items[0]).toHaveTextContent('Completada');
    expect(items[1]).toHaveTextContent('jueves, 29 de octubre de 2026');
    expect(items[1]).toHaveTextContent('Pendiente');
    expect(within(items[0] ?? document.body).getByText('miércoles, 28 de octubre de 2026')).toHaveAttribute(
      'datetime',
      '2026-10-28',
    );
    // Solo lectura: sin completar, editar ni eliminar
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('RF-34: indica la página, el total de páginas y el total de tareas, y cambia de página', () => {
    const goToPage = jest.fn();
    render(<HistoryList history={history({ page: 2, totalPages: 3, totalItems: 120, goToPage })} />);
    const pagination = screen.getByRole('navigation', { name: 'Paginación' });
    expect(pagination).toHaveTextContent('Página 2 de 3 · 120 tareas');
    within(pagination).getByRole('button', { name: 'Página siguiente' }).click();
    expect(goToPage).toHaveBeenCalledWith(3);
  });

  it('sin tareas y sin filtros dice que todavía no hay tareas', () => {
    render(<HistoryList history={history({ tasks: [], totalItems: 0, totalPages: 0 })} />);
    expect(screen.getByText('Todavía no tienes tareas.')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('sin tareas con filtros dice que no hay tareas con esos filtros', () => {
    render(<HistoryList history={history({ tasks: [], totalItems: 0, totalPages: 0, isFiltered: true })} />);
    expect(screen.getByText('No hay tareas con estos filtros.')).toBeInTheDocument();
  });

  it('RF-40: mientras carga muestra el indicador', () => {
    render(<HistoryList history={history({ status: 'loading' })} />);
    expect(screen.getByRole('status', { name: 'Cargando…' })).toBeInTheDocument();
  });

  it('RF-44: si falla muestra el error con reintento', () => {
    const retry = jest.fn();
    render(<HistoryList history={history({ status: 'error', errorMessage: 'Algo ha fallado.', retry })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Algo ha fallado.');
    screen.getByRole('button', { name: 'Reintentar' }).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
