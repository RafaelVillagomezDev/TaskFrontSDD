import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { pomodoroFixture, pomodoroPage, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { PomodoroSessionPage } from '../pomodoro-session.page';

function renderPage() {
  return render(<PomodoroSessionPage />, { wrapper: appWrapper(freshStore(), '/pomodoro') });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PomodoroSessionPage', () => {
  it('RF-04 y RF-52: sin sesión activa muestra el formulario para empezar una', async () => {
    mockApi({ 'GET /pomodoros': () => pomodoroPage([pomodoroFixture({ status: 'finished' })]) });
    renderPage();
    expect(await screen.findByRole('form', { name: 'Empezar una sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Sesión en marcha' })).not.toBeInTheDocument();
  });

  it('RF-05, RF-20 y RF-21: con una sesión activa la muestra en lugar del formulario, con sus tareas en orden', async () => {
    const session = pomodoroFixture({
      status: 'paused',
      tasks: [
        pomodoroTaskFixture({ id: 'a', title: 'Primera', completed: true }),
        pomodoroTaskFixture({ id: 'b', title: 'Segunda' }),
      ],
    });
    mockApi({ 'GET /pomodoros': () => pomodoroPage([session]), 'GET /pomodoros/p-1': () => apiOk(session) });
    renderPage();

    const region = await screen.findByRole('region', { name: 'Sesión en marcha' });
    expect(within(region).getByRole('heading', { name: 'Sesión en pausa' })).toBeInTheDocument();
    expect(within(region).getByText('1 de 2 tareas hechas')).toBeInTheDocument();
    const items = within(within(region).getByRole('list', { name: 'Tareas de la sesión' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Primera', 'Segunda']);
    expect(screen.queryByRole('form', { name: 'Empezar una sesión' })).not.toBeInTheDocument();
  });

  it('una sesión sin tareas lo indica', async () => {
    const session = pomodoroFixture({ tasks: [] });
    mockApi({ 'GET /pomodoros': () => pomodoroPage([session]), 'GET /pomodoros/p-1': () => apiOk(session) });
    renderPage();
    expect(await screen.findByText('Esta sesión no tiene tareas.')).toBeInTheDocument();
  });

  it('RF-44 (001): si falla la consulta muestra el error con «Reintentar»', async () => {
    mockApi({ 'GET /pomodoros': () => apiFail(500, 'INTERNAL_ERROR') });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
