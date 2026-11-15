import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import type { DayColumnModel } from '../../hooks/use-week-board.hook';
import type { Task } from '../../schemas/task.schema';
import { DayColumn } from '../day-column.component';

function task(id: string, completed = false): Task {
  return {
    id,
    title: `Tarea ${id}`,
    description: null,
    date: '2026-10-29',
    completed,
    createdAt: '2026-10-29T09:15:00Z',
    updatedAt: '2026-10-29T09:15:00Z',
  };
}

function column(change: Partial<DayColumnModel> = {}): DayColumnModel {
  return { day: '2026-10-29', kind: 'today', pending: [], completed: [], total: 0, ...change };
}

function renderColumn(model: DayColumnModel) {
  render(
    <DayColumn column={model}>
      <button type="button">Crear tarea</button>
    </DayColumn>,
  );
  return screen.getByRole('region', { name: 'jueves, 29 de octubre de 2026' });
}

describe('DayColumn', () => {
  it('RF-09: muestra el nombre del día, su fecha y el número de tareas', () => {
    const region = renderColumn(column({ pending: [task('a')], completed: [task('b', true)], total: 2 }));
    expect(within(region).getByRole('heading', { name: 'jueves' })).toBeInTheDocument();
    expect(region).toHaveTextContent('29/10/2026');
    expect(within(region).getByText('2 tareas')).toBeInTheDocument();
  });

  it('RF-09: el contador concuerda en singular', () => {
    const region = renderColumn(column({ pending: [task('a')], total: 1 }));
    expect(within(region).getByText('1 tarea')).toBeInTheDocument();
  });

  it('RF-10: separa pendientes y completadas, cada grupo en su lista', () => {
    const region = renderColumn(column({ pending: [task('a'), task('b')], completed: [task('c', true)], total: 3 }));
    const pending = within(region).getByRole('list', { name: 'Pendientes' });
    const completed = within(region).getByRole('list', { name: 'Completadas' });
    expect(
      within(pending)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([expect.stringContaining('Tarea a'), expect.stringContaining('Tarea b')]);
    expect(within(completed).getAllByRole('listitem')).toHaveLength(1);
  });

  it('sin completadas no pinta su grupo, y sin pendientes tampoco el suyo', () => {
    const region = renderColumn(column({ completed: [task('c', true)], total: 1 }));
    expect(within(region).queryByRole('list', { name: 'Pendientes' })).not.toBeInTheDocument();
    expect(within(region).getByRole('list', { name: 'Completadas' })).toBeInTheDocument();
  });

  it('RF-11: un día de hoy sin tareas muestra el estado vacío y la opción de crear', () => {
    const region = renderColumn(column());
    expect(region).toHaveTextContent('Sin tareas');
    expect(within(region).getByRole('button', { name: 'Crear tarea' })).toBeInTheDocument();
    expect(within(region).getByText('Hoy')).toBeInTheDocument();
    expect(within(region).queryByRole('list')).not.toBeInTheDocument();
  });

  it('RF-11: un día futuro sin tareas también ofrece crear', () => {
    const region = renderColumn(column({ kind: 'future' }));
    expect(within(region).getByRole('button', { name: 'Crear tarea' })).toBeInTheDocument();
    expect(within(region).queryByText('Hoy')).not.toBeInTheDocument();
  });

  it('RF-13: un día pasado indica que está cerrado y no ofrece crear', () => {
    const region = renderColumn(column({ kind: 'past', pending: [task('a')], total: 1 }));
    expect(within(region).getByText('Día cerrado')).toBeInTheDocument();
    expect(within(region).queryByRole('button')).not.toBeInTheDocument();
    expect(within(region).getByRole('listitem')).toHaveTextContent('Tarea a');
  });

  it('RF-11 y RF-13: un día pasado sin tareas muestra el estado vacío sin la opción de crear', () => {
    const region = renderColumn(column({ kind: 'past' }));
    expect(region).toHaveTextContent('Sin tareas');
    expect(within(region).queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['today', 1],
    ['future', 0],
    ['past', 0],
  ] as const)('RF-13, RF-20 y RF-22: en un día %s hay %i casillas de completar', (kind, checkboxes) => {
    const actions = {
      toggleCompleted: jest.fn(),
      isUpdating: () => false,
      keepsFocus: () => false,
      requestDelete: jest.fn(),
      requestEdit: jest.fn(),
    };
    render(<DayColumn column={column({ kind, pending: [task('a')], total: 1 })} actions={actions} />);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(checkboxes);
  });

  it('RF-20: la casilla de hoy completa su tarea y se anuncia deshabilitada mientras se guarda', () => {
    const toggleCompleted = jest.fn();
    const actions = {
      toggleCompleted,
      isUpdating: (id: string) => id === 'b',
      keepsFocus: () => false,
      requestDelete: jest.fn(),
      requestEdit: jest.fn(),
    };
    render(<DayColumn column={column({ pending: [task('a'), task('b')], total: 2 })} actions={actions} />);
    screen.getByRole('checkbox', { name: 'Tarea a' }).click();
    expect(toggleCompleted).toHaveBeenCalledWith(task('a'));
    expect(screen.getByRole('checkbox', { name: 'Tarea b' })).toHaveAttribute('aria-disabled', 'true');
  });

  it.each([
    ['today', 1],
    ['future', 1],
    ['past', 0],
  ] as const)('RF-13 y RF-23: en un día %s hay %i botones de eliminar', (kind, buttons) => {
    const actions = {
      toggleCompleted: jest.fn(),
      isUpdating: () => false,
      keepsFocus: () => false,
      requestDelete: jest.fn(),
      requestEdit: jest.fn(),
    };
    render(<DayColumn column={column({ kind, pending: [task('a')], total: 1 })} actions={actions} />);
    expect(screen.queryAllByRole('button', { name: 'Eliminar «Tarea a»' })).toHaveLength(buttons);
  });

  it('RF-23: el botón de eliminar pide confirmar su tarea', () => {
    const requestDelete = jest.fn();
    const actions = {
      toggleCompleted: jest.fn(),
      isUpdating: () => false,
      keepsFocus: () => false,
      requestDelete,
      requestEdit: jest.fn(),
    };
    render(<DayColumn column={column({ kind: 'future', pending: [task('a')], total: 1 })} actions={actions} />);
    screen.getByRole('button', { name: 'Eliminar «Tarea a»' }).click();
    expect(requestDelete).toHaveBeenCalledWith(task('a'));
  });
  it.each([
    ['today', 1],
    ['future', 1],
    ['past', 0],
  ] as const)('RF-13 y RF-29: en un día %s hay %i botones de editar', (kind, buttons) => {
    const requestEdit = jest.fn();
    const actions = {
      toggleCompleted: jest.fn(),
      isUpdating: () => false,
      keepsFocus: () => false,
      requestDelete: jest.fn(),
      requestEdit,
    };
    render(<DayColumn column={column({ kind, pending: [task('a')], total: 1 })} actions={actions} />);
    const edit = screen.queryAllByRole('button', { name: 'Editar «Tarea a»' });
    expect(edit).toHaveLength(buttons);
    edit[0]?.click();
    expect(requestEdit).toHaveBeenCalledTimes(buttons);
  });
});
