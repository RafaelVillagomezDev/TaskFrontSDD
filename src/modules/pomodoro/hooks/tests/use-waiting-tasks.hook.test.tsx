import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { addDays, todayKey } from '@shared/date/day.util';
import { pomodoroPage, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { useWaitingTasks } from '../use-waiting-tasks.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup(path = '/pomodoro') {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => ({ waiting: useWaitingTasks(), router: useRouterProbe() }), {
    wrapper: appWrapper(store, path),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useWaitingTasks', () => {
  it('RF-32 y RF-37: lista las tareas en espera y marca las de fecha pasada', async () => {
    const yesterday = pomodoroTaskFixture({ id: 'a', date: addDays(todayKey(), -1) });
    const tomorrow = pomodoroTaskFixture({ id: 'b', date: addDays(todayKey(), 1) });
    mockApi({ 'GET /pomodoro-tasks': () => pomodoroPage([yesterday, tomorrow]) });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.waiting.items).toHaveLength(2);
    });
    expect(result.current.waiting.items.map((item) => item.takesToday)).toEqual([true, false]);
    expect(result.current.waiting.totalItems).toBe(2);
  });

  it('RF-32: pide la página de la URL y cambiar de página la escribe en ella', async () => {
    const api = mockApi({
      'GET /pomodoro-tasks': (request) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return apiOk({ items: [pomodoroTaskFixture()], page, pageSize: 20, totalItems: 40, totalPages: 2 });
      },
    });
    const { result } = setup('/pomodoro?page=2');
    await waitFor(() => {
      expect(result.current.waiting.page).toBe(2);
    });
    expect(new URL(api.requests[0]?.url ?? 'http://x').searchParams.get('page')).toBe('2');

    act(() => {
      result.current.waiting.goToPage(1);
    });
    expect(result.current.router.location.search).toBe('');
  });

  it('RF-33: borrar pide confirmación; cancelar no borra y confirmar sí', async () => {
    const api = mockApi({
      'GET /pomodoro-tasks': () => pomodoroPage([pomodoroTaskFixture()]),
      'DELETE /pomodoro-tasks/t-1': () => apiOk(null),
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.waiting.items).toHaveLength(1);
    });

    act(() => {
      result.current.waiting.requestDelete(pomodoroTaskFixture());
    });
    expect(result.current.waiting.pendingDelete?.id).toBe('t-1');
    act(() => {
      result.current.waiting.cancelDelete();
    });
    expect(result.current.waiting.pendingDelete).toBeUndefined();

    act(() => {
      result.current.waiting.requestDelete(pomodoroTaskFixture());
    });
    await act(async () => {
      await result.current.waiting.confirmDelete();
    });
    expect(api.requests.filter((request) => request.method === 'DELETE')).toHaveLength(1);
    expect(result.current.waiting.pendingDelete).toBeUndefined();
  });

  it('RF-48: si la tarea ya está en la sesión (otra pestaña), muestra el mensaje', async () => {
    mockApi({
      'GET /pomodoro-tasks': () => pomodoroPage([pomodoroTaskFixture()]),
      'DELETE /pomodoro-tasks/t-1': () => apiFail(409, 'POMODORO_TASK_IN_SESSION'),
    });
    const { result } = setup();
    act(() => {
      result.current.waiting.requestDelete(pomodoroTaskFixture());
    });
    await act(async () => {
      await result.current.waiting.confirmDelete();
    });
    expect(result.current.waiting.actionError).toBe(
      'Esta tarea está en la sesión en marcha: quítala de la sesión antes de borrarla.',
    );
    act(() => {
      result.current.waiting.dismissError();
    });
    expect(result.current.waiting.actionError).toBeUndefined();
  });

  it('RF-44 (001): si falla la consulta muestra el error con «Reintentar»', async () => {
    let fail = true;
    mockApi({ 'GET /pomodoro-tasks': () => (fail ? apiFail(500, 'INTERNAL_ERROR') : pomodoroPage([])) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.waiting.errorMessage).toBeDefined();
    });
    fail = false;
    act(() => {
      result.current.waiting.retry();
    });
    await waitFor(() => {
      expect(result.current.waiting.errorMessage).toBeUndefined();
    });
  });
});
