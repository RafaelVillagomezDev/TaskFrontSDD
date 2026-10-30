import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { TaskDeletion } from '../../hooks/use-task-actions.hook';
import type { Task } from '../../schemas/task.schema';
import { DeleteTaskDialog } from '../delete-task-dialog.component';

const TASK: Task = {
  id: 't1',
  title: 'Comprar pan',
  description: null,
  date: '2026-10-29',
  completed: false,
  createdAt: '2026-10-29T09:15:00Z',
  updatedAt: '2026-10-29T09:15:00Z',
};

function deletion(change: Partial<TaskDeletion> = {}): TaskDeletion {
  return { pendingDelete: TASK, isDeleting: false, confirmDelete: jest.fn(), cancelDelete: jest.fn(), ...change };
}

afterEach(() => {
  document.body.style.overflow = '';
});

describe('DeleteTaskDialog', () => {
  it('sin tarea que confirmar no pinta nada', () => {
    render(<DeleteTaskDialog deletion={deletion({ pendingDelete: undefined })} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('RF-23 y S-04: pide confirmación con el título de la tarea y avisa de que no se puede deshacer', () => {
    render(<DeleteTaskDialog deletion={deletion()} />);
    const dialog = screen.getByRole('dialog', { name: '¿Eliminar la tarea?' });
    expect(dialog).toHaveTextContent('«Comprar pan» desaparecerá del tablero y del historial. No se puede deshacer.');
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('RF-24: «Eliminar» confirma', async () => {
    const user = userEvent.setup();
    const actions = deletion();
    render(<DeleteTaskDialog deletion={actions} />);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(actions.confirmDelete).toHaveBeenCalledTimes(1);
  });

  it('RF-23: «Cancelar» y Escape cancelan sin eliminar', async () => {
    const user = userEvent.setup();
    const actions = deletion();
    render(<DeleteTaskDialog deletion={actions} />);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.keyboard('{Escape}');
    expect(actions.cancelDelete).toHaveBeenCalledTimes(2);
    expect(actions.confirmDelete).not.toHaveBeenCalled();
  });

  it('RF-19: mientras se elimina, el botón se deshabilita y lo indica', () => {
    render(<DeleteTaskDialog deletion={deletion({ isDeleting: true })} />);
    expect(screen.getByRole('button', { name: 'Eliminando…' })).toBeDisabled();
  });
});
