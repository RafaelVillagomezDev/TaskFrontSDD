import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import type { Task } from '../../schemas/task.schema';
import type { PagedTasks } from '../../types/paged-tasks.types';
import { PagedTaskList } from '../paged-task-list.component';

function task(id: string, description: string | null = null): Task {
  return {
    id,
    title: `Tarea ${id}`,
    description,
    date: '2026-11-08',
    completed: true,
    createdAt: '2026-11-08T09:15:00Z',
    updatedAt: '2026-11-08T09:15:00Z',
  };
}

function list(change: Partial<PagedTasks> = {}): PagedTasks {
  return {
    status: 'ready',
    tasks: [task('a', 'Integral'), task('b')],
    page: 1,
    totalPages: 1,
    totalItems: 2,
    goToPage: jest.fn(),
    errorMessage: undefined,
    retry: jest.fn(),
    ...change,
  };
}

describe('PagedTaskList', () => {
  it('RF-02: en «Hecho hoy» cada tarea muestra su título y su descripción, sin fecha ni acciones', () => {
    render(
      <PagedTaskList list={list()} variant="taskDay">
        vacío
      </PagedTaskList>,
    );
    const items = within(screen.getByRole('list', { name: 'Tareas hechas hoy' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Tarea a');
    expect(items[0]).toHaveTextContent('Integral');
    expect(screen.queryByText(/noviembre de 2026/)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toHaveTextContent('2 tareas completadas hoy');
  });

  it('en el historial cada tarea lleva su fecha y el total de tareas', () => {
    render(
      <PagedTaskList list={list({ totalItems: 1, tasks: [task('a')] })} variant="history">
        vacío
      </PagedTaskList>,
    );
    const items = within(screen.getByRole('list', { name: 'Tareas del historial' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('domingo, 8 de noviembre de 2026');
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toHaveTextContent('1 tarea');
  });

  it('RF-04: sin tareas muestra el estado vacío que recibe en children', () => {
    render(
      <PagedTaskList list={list({ tasks: [], totalItems: 0, totalPages: 0 })} variant="taskDay">
        <p>Nada todavía</p>
      </PagedTaskList>,
    );
    expect(screen.getByText('Nada todavía')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('muestra la carga solo en su zona', () => {
    render(
      <PagedTaskList list={list({ status: 'loading', tasks: [] })} variant="taskDay">
        vacío
      </PagedTaskList>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('vacío')).not.toBeInTheDocument();
  });

  it('ante un error muestra el mensaje con «Reintentar»', () => {
    const retry = jest.fn();
    render(
      <PagedTaskList
        list={list({ status: 'error', tasks: [], errorMessage: 'Algo ha fallado.', retry })}
        variant="taskDay"
      >
        vacío
      </PagedTaskList>,
    );
    expect(screen.getByText('Algo ha fallado.')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Reintentar' }).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('cambia de página', () => {
    const goToPage = jest.fn();
    render(
      <PagedTaskList list={list({ page: 1, totalPages: 2, totalItems: 60, goToPage })} variant="taskDay">
        vacío
      </PagedTaskList>,
    );
    screen.getByRole('button', { name: 'Página siguiente' }).click();
    expect(goToPage).toHaveBeenCalledWith(2);
  });
});
