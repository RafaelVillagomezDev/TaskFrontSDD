import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { pomodoroFixture, pomodoroPage } from '../../tests/pomodoro.fixtures';
import { PomodoroHistoryPage } from '../pomodoro-history.page';

function renderPage(path = '/pomodoro/history') {
  return render(<PomodoroHistoryPage />, { wrapper: appWrapper(freshStore(), path) });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PomodoroHistoryPage', () => {
  it('RF-38 y RF-53: lista las sesiones de la más reciente a la más antigua con su total', async () => {
    mockApi({
      'GET /pomodoros': () =>
        pomodoroPage([
          pomodoroFixture({ id: 'a', status: 'finished', durationMinutes: 15 }),
          pomodoroFixture({ id: 'b', status: 'finished', durationMinutes: 60 }),
        ]),
    });
    renderPage();

    const list = await screen.findByRole('list', { name: 'Sesiones' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0] ?? list).getByText('Sesión de 15 min')).toBeInTheDocument();
    expect(within(items[1] ?? list).getByText('Sesión de 60 min')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 1 · 2 sesiones')).toBeInTheDocument();
  });

  it('RF-38: con varias páginas ofrece cambiar de página', async () => {
    mockApi({
      'GET /pomodoros': () =>
        apiOk({ items: [pomodoroFixture({ status: 'finished' })], page: 1, pageSize: 20, totalItems: 21, totalPages: 2 }),
    });
    renderPage();
    expect(await screen.findByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('sin sesiones muestra el estado vacío con acceso a empezar una', async () => {
    mockApi({ 'GET /pomodoros': () => pomodoroPage([]) });
    renderPage();

    expect(await screen.findByText('Todavía no tienes sesiones.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Empezar una sesión' })).toHaveAttribute('href', '/pomodoro');
    expect(screen.queryByRole('list', { name: 'Sesiones' })).not.toBeInTheDocument();
  });

  it('RF-44 (001): si falla la consulta muestra el error con «Reintentar»', async () => {
    mockApi({ 'GET /pomodoros': () => apiFail(500, 'INTERNAL_ERROR') });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
