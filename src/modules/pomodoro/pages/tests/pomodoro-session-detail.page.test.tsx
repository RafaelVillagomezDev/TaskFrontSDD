import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { freshStore } from '@test-utils/render-app';
import { formatDateTime } from '@shared/date/date-format.util';
import { pomodoroFixture, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { PomodoroSessionDetailPage } from '../pomodoro-session-detail.page';

function renderPage(id = 'p-1') {
  return render(
    <Provider store={freshStore()}>
      <MemoryRouter initialEntries={[`/pomodoro/history/${id}`]}>
        <Routes>
          <Route path="/pomodoro/history/:id" element={<PomodoroSessionDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

const SESSION = pomodoroFixture({
  status: 'finished',
  endReason: 'manual',
  focusedSeconds: 600,
  tasks: [
    pomodoroTaskFixture({ id: 'a', title: 'Leer el capítulo', completed: true, description: 'Del 1 al 3' }),
    pomodoroTaskFixture({ id: 'b', title: 'Hacer resúmenes' }),
  ],
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PomodoroSessionDetailPage', () => {
  it('RF-39, RF-40 y RF-54: muestra la sesión con sus tareas tal como quedaron, en solo lectura', async () => {
    mockApi({ 'GET /pomodoros/p-1': () => apiOk(SESSION) });
    renderPage();

    expect(await screen.findByRole('heading', { name: formatDateTime(SESSION.startedAt) })).toBeInTheDocument();
    expect(screen.getByText('Terminada a mano · 10 min de concentración')).toBeInTheDocument();
    expect(screen.getByText('1 de 2 tareas hechas')).toBeInTheDocument();

    const items = within(screen.getByRole('list', { name: 'Tareas de la sesión' })).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Completada: Leer el capítuloDel 1 al 3',
      'Pendiente: Hacer resúmenes',
    ]);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /editar|quitar|borrar/i })).not.toBeInTheDocument();
  });

  it('RF-54: ofrece volver al historial', async () => {
    mockApi({ 'GET /pomodoros/p-1': () => apiOk(SESSION) });
    renderPage();
    expect(await screen.findByRole('link', { name: 'Volver al historial' })).toHaveAttribute('href', '/pomodoro/history');
  });

  it('una sesión sin tareas lo indica', async () => {
    mockApi({ 'GET /pomodoros/p-1': () => apiOk(pomodoroFixture({ status: 'finished', tasks: [] })) });
    renderPage();
    expect(await screen.findByText('Esta sesión no tuvo tareas.')).toBeInTheDocument();
  });

  it('una sesión que sigue activa lleva a la sesión en marcha', async () => {
    mockApi({ 'GET /pomodoros/p-1': () => apiOk(pomodoroFixture({ status: 'running' })) });
    renderPage();
    expect(await screen.findByText('Esta sesión sigue en marcha.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a la sesión' })).toHaveAttribute('href', '/pomodoro');
  });

  it('RF-49: con POMODORO_NOT_FOUND muestra que no existe y da acceso al pomodoro', async () => {
    mockApi({ 'GET /pomodoros/otra': () => apiFail(404, 'POMODORO_NOT_FOUND') });
    renderPage('otra');

    expect(await screen.findByText('No encontramos esta sesión.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al pomodoro' })).toHaveAttribute('href', '/pomodoro');
  });

  it('RF-44 (001): otro error muestra el mensaje con «Reintentar»', async () => {
    mockApi({ 'GET /pomodoros/p-1': () => apiFail(500, 'INTERNAL_ERROR') });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
