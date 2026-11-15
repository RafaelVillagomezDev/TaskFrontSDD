import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { Button } from '@shared/ui/button.component';
import { useEditPomodoroTask } from '../../hooks/use-edit-pomodoro-task.hook';
import { pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { EditPomodoroTaskDialog } from '../edit-pomodoro-task-dialog.component';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function Harness() {
  const editTask = useEditPomodoroTask();
  return (
    <>
      <Button
        onClick={() => {
          editTask.open(pomodoroTaskFixture());
        }}
      >
        Abrir
      </Button>
      <EditPomodoroTaskDialog editTask={editTask} />
    </>
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('EditPomodoroTaskDialog', () => {
  it('RF-35 y RF-36: edita el título sin campo de fecha y se cierra al guardar', async () => {
    const user = userEvent.setup();
    const api = mockApi({ 'PATCH /pomodoro-tasks/t-1': () => apiOk(pomodoroTaskFixture()) });
    const store = freshStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
    render(<Harness />, { wrapper: appWrapper(store, '/pomodoro') });

    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    expect(screen.queryByLabelText('Fecha')).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent('La fecha de una tarea del pomodoro no se puede cambiar.');

    await user.clear(screen.getByLabelText('Título'));
    await user.type(screen.getByLabelText('Título'), 'Repasar 3 y 4');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(dialog).not.toBeInTheDocument();
    });
    expect(await api.bodyOf('PATCH /pomodoro-tasks/t-1')).toMatchObject({ title: 'Repasar 3 y 4' });
  });
});
