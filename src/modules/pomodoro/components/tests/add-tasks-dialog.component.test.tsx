import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { Button } from '@shared/ui/button.component';
import { useAddTasksForm } from '../../hooks/use-add-tasks-form.hook';
import { pomodoroFixture } from '../../tests/pomodoro.fixtures';
import { AddTasksDialog } from '../add-tasks-dialog.component';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function Harness() {
  const addForm = useAddTasksForm(pomodoroFixture());
  return (
    <>
      <Button onClick={addForm.open}>Abrir</Button>
      <AddTasksDialog addForm={addForm} />
    </>
  );
}

function renderDialog() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  render(<Harness />, { wrapper: appWrapper(store, '/pomodoro') });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AddTasksDialog', () => {
  it('RF-29: diálogo con una fila de tarea; al añadir se cierra', async () => {
    const user = userEvent.setup();
    const api = mockApi({ 'POST /pomodoros/p-1/tasks': () => apiOk(pomodoroFixture()) });
    renderDialog();
    await user.click(screen.getByRole('button', { name: 'Abrir' }));

    const dialog = screen.getByRole('dialog', { name: 'Añadir tareas a la sesión' });
    expect(screen.getByRole('group', { name: 'Tarea 1' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Título'), 'Llamar a Marta');
    await user.click(screen.getByRole('button', { name: 'Añadir' }));

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
    expect(api.requests).toHaveLength(1);
  });

  it('RF-08: un título vacío muestra el error bajo el campo sin cerrar el diálogo', async () => {
    const user = userEvent.setup();
    mockApi({});
    renderDialog();
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(screen.getByRole('button', { name: 'Añadir' }));
    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription('Escribe un título.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
