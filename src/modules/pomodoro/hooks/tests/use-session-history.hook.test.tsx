import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { pomodoroFixture, pomodoroPage } from '../../tests/pomodoro.fixtures';
import { useSessionHistory } from '../use-session-history.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup(path = '/pomodoro/history') {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => ({ history: useSessionHistory(), router: useRouterProbe() }), {
    wrapper: appWrapper(store, path),
  });
}

function pageOf(page: number, totalPages: number) {
  return apiOk({ items: [pomodoroFixture({ id: `p-${String(page)}` })], page, pageSize: 20, totalItems: 30, totalPages });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useSessionHistory', () => {
  it('RF-38: muestra las sesiones en el orden de la API, de la más reciente a la más antigua', async () => {
    const sessions = [
      pomodoroFixture({ id: 'nueva', status: 'finished' }),
      pomodoroFixture({ id: 'vieja', status: 'finished' }),
    ];
    mockApi({ 'GET /pomodoros': () => pomodoroPage(sessions) });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.history.status).toBe('ready');
    });
    expect(result.current.history.sessions.map((session) => session.id)).toEqual(['nueva', 'vieja']);
    expect(result.current.history.totalItems).toBe(2);
  });

  it('RF-38: pide la página de la URL y cambiar de página la escribe en ella', async () => {
    const api = mockApi({
      'GET /pomodoros': (request) => pageOf(Number(new URL(request.url).searchParams.get('page')), 2),
    });
    const { result } = setup('/pomodoro/history?page=2');

    await waitFor(() => {
      expect(result.current.history.sessions[0]?.id).toBe('p-2');
    });
    expect(result.current.history.page).toBe(2);
    expect(result.current.history.totalPages).toBe(2);
    expect(new URL(api.requests[0]?.url ?? 'http://x').searchParams.get('page')).toBe('2');

    act(() => {
      result.current.history.goToPage(1);
    });
    expect(result.current.router.location.search).toBe('');
  });

  it('RF-38: una página fuera de rango lleva a la última, sin añadir una entrada al historial', async () => {
    mockApi({
      'GET /pomodoros': (request) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return page > 3 ? apiOk({ items: [], page, pageSize: 20, totalItems: 50, totalPages: 3 }) : pageOf(page, 3);
      },
    });
    const { result } = setup('/pomodoro/history?page=9');

    await waitFor(() => {
      expect(result.current.router.location.search).toBe('?page=3');
    });
    expect(result.current.router.navigationType).toBe('REPLACE');
  });

  it('sin sesiones la lista está vacía', async () => {
    mockApi({ 'GET /pomodoros': () => pomodoroPage([]) });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.history.status).toBe('ready');
    });
    expect(result.current.history.sessions).toEqual([]);
  });

  it('RF-44 (001): si falla la consulta da el mensaje y reintentar la repite', async () => {
    let calls = 0;
    mockApi({
      'GET /pomodoros': () => {
        calls += 1;
        return calls === 1 ? apiFail(500, 'INTERNAL_ERROR') : pomodoroPage([pomodoroFixture()]);
      },
    });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.history.status).toBe('error');
    });
    expect(result.current.history.errorMessage).toEqual(expect.any(String));

    act(() => {
      result.current.history.retry();
    });
    await waitFor(() => {
      expect(result.current.history.status).toBe('ready');
    });
  });
});
