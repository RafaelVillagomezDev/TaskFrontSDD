import { jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { apiOk, mockApi } from '../../../../../jest/mock-api';
import { freshStore } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { useTaskForm } from '../../hooks/use-task-form.hook';
import { TaskFormDialog } from '../task-form-dialog.component';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function Harness() {
  const taskForm = useTaskForm({ today: '2026-10-29', weekStart: '2026-10-29', weekEnd: '2026-11-04' });
  return (
    <>
      <button
        type="button"
        onClick={() => {
          taskForm.openFor('2026-10-30');
        }}
      >
        Abrir
      </button>
      <TaskFormDialog taskForm={taskForm} />
    </>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
  await user.click(screen.getByRole('button', { name: 'Abrir' }));
  return { user, dialog: screen.getByRole('dialog', { name: 'Nueva tarea' }) };
}

afterEach(() => {
  document.body.style.overflow = '';
  jest.restoreAllMocks();
});

describe('TaskFormDialog (crear)', () => {
  it('cerrado no pinta nada', () => {
    const store = freshStore();
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('RF-15 y RF-16: es un diálogo con título, descripción y fecha propuesta, sin días pasados', async () => {
    const { dialog } = await openDialog();
    expect(within(dialog).getByLabelText('Título')).toHaveFocus();
    expect(within(dialog).getByLabelText('Descripción (opcional)').tagName).toBe('TEXTAREA');
    const date = within(dialog).getByLabelText('Fecha');
    expect(date).toHaveAttribute('type', 'date');
    expect(date).toHaveValue('2026-10-30');
    expect(date).toHaveAttribute('min', '2026-10-29');
  });

  it('RF-17: muestra los contadores con su máximo mientras se escribe', async () => {
    const { user, dialog } = await openDialog();
    const title = within(dialog).getByLabelText('Título');
    const description = within(dialog).getByLabelText('Descripción (opcional)');
    expect(title).toHaveAccessibleDescription('0/200 caracteres');
    expect(description).toHaveAccessibleDescription('0/1000 caracteres');
    await user.type(title, 'Pan');
    await user.type(description, 'Integral');
    expect(title).toHaveAccessibleDescription('3/200 caracteres');
    expect(description).toHaveAccessibleDescription('8/1000 caracteres');
  });

  it('RF-02: muestra cada error bajo su campo sin enviar nada', async () => {
    const api = mockApi({});
    const { user, dialog } = await openDialog();
    await user.clear(within(dialog).getByLabelText('Fecha'));
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarea' }));
    expect(await within(dialog).findByText('Escribe un título.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Título')).toHaveAccessibleDescription(
      '0/200 caracteres Escribe un título.',
    );
    expect(within(dialog).getByLabelText('Fecha')).toHaveAccessibleDescription('Elige una fecha.');
    expect(api.requests).toHaveLength(0);
  });

  it('RF-19: el botón se deshabilita mientras se envía y el diálogo se cierra al crear', async () => {
    let release: (response: Response) => void = () => undefined;
    mockApi({
      'POST /tasks': () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    });
    const { user, dialog } = await openDialog();
    await user.type(within(dialog).getByLabelText('Título'), 'Comprar pan');
    await user.click(within(dialog).getByRole('button', { name: 'Crear tarea' }));
    expect(await within(dialog).findByRole('button', { name: 'Creando…' })).toBeDisabled();
    release(
      apiOk(
        {
          id: 'n',
          title: 'Comprar pan',
          description: null,
          date: '2026-10-30',
          completed: false,
          createdAt: '2026-10-29T09:15:00Z',
          updatedAt: '2026-10-29T09:15:00Z',
        },
        201,
      ),
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('«Cancelar» cierra el diálogo y devuelve el foco', async () => {
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();
  });
});
