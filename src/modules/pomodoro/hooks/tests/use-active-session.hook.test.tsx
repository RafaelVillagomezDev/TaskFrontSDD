import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '@test-utils/render-app';
import { pomodoroFixture, pomodoroPage } from '../../tests/pomodoro.fixtures';
import { useActiveSession } from '../use-active-session.hook';

function setup(path = '/pomodoro') {
  const store = freshStore();
  return renderHook(() => ({ active: useActiveSession(), router: useRouterProbe() }), {
    wrapper: appWrapper(store, path),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useActiveSession', () => {
  it('RF-04: sin sesiones muestra el formulario', async () => {
    mockApi({ 'GET /pomodoros': () => pomodoroPage([]) });
    const { result } = setup();
    expect(result.current.active.view.kind).toBe('loading');
    await waitFor(() => {
      expect(result.current.active.view.kind).toBe('form');
    });
  });

  it.each(['running', 'paused'] as const)('RF-03 y RF-05: la primera sesión %s es la sesión activa', async (status) => {
    const api = mockApi({
      'GET /pomodoros': () => pomodoroPage([pomodoroFixture({ id: 'p-2', status }), pomodoroFixture({ id: 'p-1' })]),
      'GET /pomodoros/p-2': () => apiOk(pomodoroFixture({ id: 'p-2', status, totalTasks: 3 })),
    });
    const { result } = setup();

    await waitFor(() => {
      const { view } = result.current.active;
      expect(view.kind === 'session' && view.session.totalTasks).toBe(3);
    });
    expect(new URL(api.requests[0]?.url ?? 'http://x').searchParams.get('page')).toBe('1');
  });

  it('RF-04: si la más reciente está terminada muestra el formulario sin pedir su detalle', async () => {
    const api = mockApi({ 'GET /pomodoros': () => pomodoroPage([pomodoroFixture({ status: 'finished' })]) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.active.view.kind).toBe('form');
    });
    expect(api.requests).toHaveLength(1);
  });

  it('RF-44 (001): si falla la consulta muestra el error y «Reintentar» vuelve a pedirla', async () => {
    let fail = true;
    mockApi({ 'GET /pomodoros': () => (fail ? apiFail(500, 'INTERNAL_ERROR') : pomodoroPage([])) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.active.view).toEqual({
        kind: 'error',
        message: 'Algo ha fallado. Inténtalo de nuevo en unos segundos.',
      });
    });

    fail = false;
    act(() => {
      result.current.active.retry();
    });
    await waitFor(() => {
      expect(result.current.active.view.kind).toBe('form');
    });
  });
});

describe('useActiveSession: resultado (RF-17, RF-71, RF-72)', () => {
  it('RF-72: con ?result en la URL y sin sesión activa muestra el resultado de esa sesión', async () => {
    const finished = pomodoroFixture({ id: 'p-1', status: 'finished' });
    mockApi({ 'GET /pomodoros': () => pomodoroPage([finished]), 'GET /pomodoros/p-1': () => apiOk(finished) });
    const { result } = setup('/pomodoro?result=p-1');

    await waitFor(() => {
      const { view } = result.current.active;
      expect(view.kind === 'result' && view.session?.status).toBe('finished');
    });
  });

  it('RF-71: «Empezar otra sesión» quita el resultado de la URL y vuelve al formulario', async () => {
    const finished = pomodoroFixture({ id: 'p-1', status: 'finished' });
    mockApi({ 'GET /pomodoros': () => pomodoroPage([finished]), 'GET /pomodoros/p-1': () => apiOk(finished) });
    const { result } = setup('/pomodoro?result=p-1');
    await waitFor(() => {
      expect(result.current.active.view.kind).toBe('result');
    });

    act(() => {
      result.current.active.clearResult();
    });

    expect(result.current.router.location.search).toBe('');
    expect(result.current.active.view.kind).toBe('form');
    expect(result.current.router.navigationType).toBe('REPLACE');
  });

  it('RF-17: al consultar una sesión que ya terminó guarda su resultado en la URL y deja de estar activa', async () => {
    let finished = false;
    mockApi({
      'GET /pomodoros': () => pomodoroPage([pomodoroFixture({ status: finished ? 'finished' : 'running' })]),
      'GET /pomodoros/p-1': () => apiOk(pomodoroFixture({ status: finished ? 'finished' : 'running' })),
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.active.view.kind).toBe('session');
    });

    finished = true;
    let stillActive = true;
    await act(async () => {
      stillActive = await result.current.active.refresh();
    });

    expect(stillActive).toBe(false);
    expect(result.current.router.location.search).toBe('?result=p-1');
    await waitFor(() => {
      expect(result.current.active.view.kind).toBe('result');
    });
  });

  it('RF-18: si la API aún la da por activa, refresh devuelve true y no muestra resultado', async () => {
    mockApi({
      'GET /pomodoros': () => pomodoroPage([pomodoroFixture()]),
      'GET /pomodoros/p-1': () => apiOk(pomodoroFixture({ remainingSeconds: 0 })),
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.active.view.kind).toBe('session');
    });

    let stillActive = false;
    await act(async () => {
      stillActive = await result.current.active.refresh();
    });

    expect(stillActive).toBe(true);
    expect(result.current.router.location.search).toBe('');
  });

  it('una sesión activa tiene prioridad sobre un resultado antiguo en la URL', async () => {
    mockApi({
      'GET /pomodoros': () => pomodoroPage([pomodoroFixture({ id: 'p-2' })]),
      'GET /pomodoros/p-2': () => apiOk(pomodoroFixture({ id: 'p-2' })),
      'GET /pomodoros/p-1': () => apiOk(pomodoroFixture({ id: 'p-1', status: 'finished' })),
    });
    const { result } = setup('/pomodoro?result=p-1');
    await waitFor(() => {
      const { view } = result.current.active;
      expect(view.kind === 'session' && view.session.id).toBe('p-2');
    });
  });
});
