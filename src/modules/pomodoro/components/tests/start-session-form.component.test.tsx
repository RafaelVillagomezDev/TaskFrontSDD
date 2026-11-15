import { jest } from '@jest/globals';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { pomodoroFixture } from '../../tests/pomodoro.fixtures';
import { renderWithStartForm } from '../../tests/start-form.harness';
import { StartSessionForm } from '../start-session-form.component';

function renderForm() {
  return renderWithStartForm((startForm) => <StartSessionForm startForm={startForm} />);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('StartSessionForm', () => {
  it('RF-04 y RF-14: empieza una sesión de 25 minutos sin tareas', async () => {
    const user = userEvent.setup();
    const api = mockApi({ 'POST /pomodoros': () => apiOk(pomodoroFixture(), 201) });
    renderForm();

    expect(screen.getByRole('heading', { name: 'Nueva sesión' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Empezar sesión' }));

    await waitFor(async () => {
      expect(await api.bodyOf('POST /pomodoros')).toEqual({ durationMinutes: 25, newTasks: [], waitingTaskIds: [] });
    });
  });

  it('RF-07 y RF-08: muestra cada error bajo su campo y no envía nada', async () => {
    const user = userEvent.setup();
    const api = mockApi({});
    renderForm();
    await user.click(screen.getByRole('radio', { name: 'Otra' }));
    await user.type(screen.getByLabelText('Minutos'), '0');
    await user.click(screen.getByRole('button', { name: 'Añadir tarea' }));

    await user.click(screen.getByRole('button', { name: 'Empezar sesión' }));

    const minutes = screen.getByLabelText('Minutos');
    expect(minutes).toHaveAttribute('aria-invalid', 'true');
    expect(minutes).toHaveAccessibleDescription(/Elige entre 1 y 120 minutos\./);
    const title = within(screen.getByRole('group', { name: 'Tarea 1' })).getByLabelText('Título');
    expect(title).toHaveAccessibleDescription('Escribe un título.');
    expect(api.requests).toHaveLength(0);
  });

  it('RF-47: un rechazo de la API se muestra encima del botón y conserva lo escrito', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /pomodoros': () => apiFail(409, 'DAY_CLOSED') });
    renderForm();
    await user.click(screen.getByRole('button', { name: 'Añadir tarea' }));
    await user.type(screen.getByLabelText('Título'), 'Repasar');

    await user.click(screen.getByRole('button', { name: 'Empezar sesión' }));

    expect(await screen.findByText('Ese día ya está cerrado: sus tareas no se pueden cambiar.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Repasar');
  });

  it('se rellena y se envía solo con el teclado', async () => {
    const user = userEvent.setup();
    const api = mockApi({ 'POST /pomodoros': () => apiOk(pomodoroFixture(), 201) });
    renderForm();

    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: '15 min' })).toBeChecked();
    await user.tab();
    await user.keyboard('{Enter}');
    await user.keyboard('Repasar');
    screen.getByRole('button', { name: 'Empezar sesión' }).focus();
    await user.keyboard('{Enter}');

    await waitFor(async () => {
      expect(await api.bodyOf('POST /pomodoros')).toMatchObject({
        durationMinutes: 15,
        newTasks: [{ title: 'Repasar' }],
      });
    });
  });
});
