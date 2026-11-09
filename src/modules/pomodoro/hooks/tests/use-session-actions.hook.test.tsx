import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import type { Pomodoro } from '../../schemas/pomodoro.schema';
import { pomodoroFixture, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { useSessionActions, type SessionActionsOptions } from '../use-session-actions.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

// session null: sin sesión activa (undefined aplicaría el valor por defecto)
function setup(session: Pomodoro | null = pomodoroFixture()) {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  const options: SessionActionsOptions = {
    session: session ?? undefined,
    primeSound: jest.fn(),
    announce: jest.fn(),
    showResult: jest.fn(),
  };
  const view = renderHook(() => useSessionActions(options), { wrapper: appWrapper(store, '/pomodoro') });
  return { ...view, options };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useSessionActions: tareas (RF-22)', () => {
  it('RF-22: completa una tarea pendiente y desmarca una completada', async () => {
    const api = mockApi({ 'PATCH /pomodoro-tasks/t-1': () => apiOk(pomodoroTaskFixture({ completed: true })) });
    const { result } = setup();

    await act(async () => {
      await result.current.toggleTask(pomodoroTaskFixture());
    });
    expect(await api.bodyOf('PATCH /pomodoro-tasks/t-1')).toEqual({ completed: true });

    await act(async () => {
      await result.current.toggleTask(pomodoroTaskFixture({ completed: true }));
    });
    expect(await api.bodyOf('PATCH /pomodoro-tasks/t-1', 1)).toEqual({ completed: false });
  });

  it('plan D-2: mientras se guarda, la tarea queda marcada como «guardando»', async () => {
    const gate: { respond: (response: Response) => void } = { respond: () => undefined };
    const api = mockApi({
      'PATCH /pomodoro-tasks/t-1': () =>
        new Promise<Response>((resolve) => {
          gate.respond = resolve;
        }),
    });
    const { result } = setup();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.toggleTask(pomodoroTaskFixture());
    });
    expect(result.current.savingTaskId).toBe('t-1');
    // La respuesta solo se puede dar cuando la petición ya ha llegado a la API simulada
    await waitFor(() => {
      expect(api.requests).toHaveLength(1);
    });

    await act(async () => {
      gate.respond(apiOk(pomodoroTaskFixture({ completed: true })));
      await pending;
    });
    expect(result.current.savingTaskId).toBeUndefined();
  });

  it('RF-48: un rechazo de estado muestra su mensaje, que se puede cerrar', async () => {
    mockApi({ 'PATCH /pomodoro-tasks/t-1': () => apiFail(409, 'INVALID_POMODORO_STATE') });
    const { result } = setup();

    await act(async () => {
      await result.current.toggleTask(pomodoroTaskFixture());
    });

    expect(result.current.actionError).toBe(
      'La sesión ha cambiado (puede que desde otra pestaña). Te mostramos cómo está ahora.',
    );
    act(() => {
      result.current.dismissError();
    });
    expect(result.current.actionError).toBeUndefined();
  });
});

describe('useSessionActions: quitar tareas (RF-30)', () => {
  it('RF-30: quita una tarea pendiente de la sesión', async () => {
    const api = mockApi({ 'DELETE /pomodoros/p-1/tasks/t-1': () => apiOk(pomodoroFixture({ tasks: [] })) });
    const { result } = setup();
    await act(async () => {
      await result.current.removeTask(pomodoroTaskFixture());
    });
    expect(api.requests).toHaveLength(1);
    expect(result.current.actionError).toBeUndefined();
  });

  it('RF-48: con POMODORO_TASK_COMPLETED explica que hay que desmarcarla', async () => {
    mockApi({ 'DELETE /pomodoros/p-1/tasks/t-1': () => apiFail(409, 'POMODORO_TASK_COMPLETED') });
    const { result } = setup();
    await act(async () => {
      await result.current.removeTask(pomodoroTaskFixture());
    });
    expect(result.current.actionError).toBe('No puedes quitar una tarea completada: desmárcala antes.');
  });
});

describe('useSessionActions: pausar, reanudar y terminar (RF-23 a RF-26)', () => {
  it('RF-23 y RF-63: pausar envía status paused y lo anuncia con el tiempo restante', async () => {
    const api = mockApi({
      'PATCH /pomodoros/p-1': () => apiOk(pomodoroFixture({ status: 'paused', remainingSeconds: 754 })),
    });
    const { result, options } = setup();

    await act(async () => {
      await result.current.pause();
    });

    expect(await api.bodyOf('PATCH /pomodoros/p-1')).toEqual({ status: 'paused' });
    expect(options.announce).toHaveBeenCalledWith('paused', 754);
  });

  it('RF-24 y plan D-5: reanudar prepara el sonido en el gesto, envía status running y lo anuncia', async () => {
    const api = mockApi({ 'PATCH /pomodoros/p-1': () => apiOk(pomodoroFixture({ remainingSeconds: 754 })) });
    const { result, options } = setup(pomodoroFixture({ status: 'paused' }));

    await act(async () => {
      await result.current.resume();
    });

    expect(options.primeSound).toHaveBeenCalled();
    expect(await api.bodyOf('PATCH /pomodoros/p-1')).toEqual({ status: 'running' });
    expect(options.announce).toHaveBeenCalledWith('resumed', 754);
  });

  it('RF-26: terminar pide confirmación; cancelar no envía nada', () => {
    const api = mockApi({});
    const { result } = setup();

    act(() => {
      result.current.requestFinish();
    });
    expect(result.current.confirmingFinish).toBe(true);
    act(() => {
      result.current.cancelFinish();
    });

    expect(result.current.confirmingFinish).toBe(false);
    expect(api.requests).toHaveLength(0);
  });

  it('RF-26 y RF-72: al confirmar termina la sesión y muestra su resultado', async () => {
    const api = mockApi({ 'PATCH /pomodoros/p-1': () => apiOk(pomodoroFixture({ status: 'finished' })) });
    const { result, options } = setup();

    act(() => {
      result.current.requestFinish();
    });
    await act(async () => {
      await result.current.confirmFinish();
    });

    expect(await api.bodyOf('PATCH /pomodoros/p-1')).toEqual({ status: 'finished' });
    expect(options.showResult).toHaveBeenCalledWith('p-1');
    expect(result.current.confirmingFinish).toBe(false);
  });

  it('RF-48: si la sesión ya terminó en otra pestaña, muestra el mensaje y no anuncia nada', async () => {
    mockApi({ 'PATCH /pomodoros/p-1': () => apiFail(409, 'INVALID_POMODORO_STATE') });
    const { result, options } = setup();

    await act(async () => {
      await result.current.pause();
    });

    await waitFor(() => {
      expect(result.current.actionError).toBeDefined();
    });
    expect(options.announce).not.toHaveBeenCalled();
  });

  it('sin sesión activa las acciones no llaman a la API', async () => {
    const api = mockApi({});
    const { result } = setup(null);
    await act(async () => {
      await result.current.pause();
      await result.current.confirmFinish();
      await result.current.removeTask(pomodoroTaskFixture());
    });
    expect(api.requests).toHaveLength(0);
  });
});
