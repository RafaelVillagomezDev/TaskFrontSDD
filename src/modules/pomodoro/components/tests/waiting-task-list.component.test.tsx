import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { WaitingTasks } from '../../hooks/use-waiting-tasks.hook';
import { pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { WaitingTaskList } from '../waiting-task-list.component';

function waitingModel(overrides: Partial<WaitingTasks> = {}): WaitingTasks {
  return {
    items: [
      { task: pomodoroTaskFixture({ id: 'a', title: 'Antigua', description: 'Nota' }), takesToday: true },
      { task: pomodoroTaskFixture({ id: 'b', title: 'Futura', date: '2026-12-01' }), takesToday: false },
    ],
    page: 1,
    totalPages: 1,
    totalItems: 2,
    errorMessage: undefined,
    actionError: undefined,
    pendingDelete: undefined,
    isDeleting: false,
    goToPage: jest.fn(),
    retry: jest.fn(),
    requestDelete: jest.fn(),
    cancelDelete: jest.fn(),
    confirmDelete: jest.fn(() => Promise.resolve()),
    dismissError: jest.fn(),
    ...overrides,
  };
}

describe('WaitingTaskList', () => {
  it('RF-32, RF-34 y RF-37: lista con título, descripción y fecha, sin casilla de completar', () => {
    render(<WaitingTaskList waiting={waitingModel()} onEdit={jest.fn()} />);
    const list = screen.getByRole('list', { name: 'Tareas en espera' });
    const [first, second] = within(list).getAllByRole('listitem');
    expect(first).toHaveTextContent('Antigua');
    expect(first).toHaveTextContent('Nota');
    expect(first).toHaveTextContent('Tomará la fecha de hoy');
    expect(second).toHaveTextContent(/Para el/);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toHaveTextContent('2 tareas en espera');
  });

  it('RF-33 y RF-35: editar y borrar cada tarea', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const waiting = waitingModel();
    render(<WaitingTaskList waiting={waiting} onEdit={onEdit} />);

    await user.click(screen.getByRole('button', { name: 'Editar «Antigua»' }));
    await user.click(screen.getByRole('button', { name: 'Borrar «Futura»' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
    expect(waiting.requestDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
  });

  it('sin tareas en espera no se muestra', () => {
    const { container } = render(<WaitingTaskList waiting={waitingModel({ items: [] })} onEdit={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('un error de la consulta se muestra con «Reintentar»; uno de una acción, con cerrar', async () => {
    const user = userEvent.setup();
    const failing = waitingModel({ errorMessage: 'Algo ha fallado.' });
    const { unmount } = render(<WaitingTaskList waiting={failing} onEdit={jest.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(failing.retry).toHaveBeenCalled();
    unmount();

    render(<WaitingTaskList waiting={waitingModel({ actionError: 'No se pudo.' })} onEdit={jest.fn()} />);
    expect(screen.getByText('No se pudo.')).toBeInTheDocument();
  });
});
