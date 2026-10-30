import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import type { Task } from '../../schemas/task.schema';
import { useTaskActions } from '../use-task-actions.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function task(id: string, completed = false): Task {
  return {
    id,
    title: `Tarea ${id}`,
    description: null,
    date: '2026-10-29',
    completed,
    createdAt: '2026-10-29T09:15:00Z',
    updatedAt: '2026-10-29T09:15:00Z',
  };
}

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => useTaskActions(), { wrapper: appWrapper(store, '/') });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useTaskActions', () => {
  it('RF-20: completar una tarea pendiente envía completed: true', async () => {
    const api = mockApi({ 'PATCH /tasks/t1': () => apiOk(task('t1', true)) });
    const { result } = setup();
    act(() => {
      result.current.toggleCompleted(task('t1'));
    });
    await waitFor(() => {
      expect(api.requests).toHaveLength(1);
    });
    expect(await api.bodyOf('PATCH /tasks/t1')).toEqual({ completed: true });
  });

  it('RF-21: desmarcar una tarea completada envía completed: false', async () => {
    const api = mockApi({ 'PATCH /tasks/t1': () => apiOk(task('t1')) });
    const { result } = setup();
    act(() => {
      result.current.toggleCompleted(task('t1', true));
    });
    await waitFor(() => {
      expect(api.requests).toHaveLength(1);
    });
    expect(await api.bodyOf('PATCH /tasks/t1')).toEqual({ completed: false });
  });

  it('mientras se guarda, la tarea está ocupada y un segundo cambio se descarta', async () => {
    let release: (response: Response) => void = () => undefined;
    const api = mockApi({
      'PATCH /tasks/t1': () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    });
    const { result } = setup();
    act(() => {
      result.current.toggleCompleted(task('t1'));
    });
    expect(result.current.isUpdating('t1')).toBe(true);
    expect(result.current.isUpdating('t2')).toBe(false);
    expect(result.current.keepsFocus('t1')).toBe(true);
    act(() => {
      result.current.toggleCompleted(task('t1', true));
    });
    await waitFor(() => {
      expect(api.requests).toHaveLength(1);
    });
    await act(async () => {
      release(apiOk(task('t1', true)));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.isUpdating('t1')).toBe(false);
    });
    expect(result.current.keepsFocus('t1')).toBe(false);
    expect(api.requests).toHaveLength(1);
  });

  it.each([
    ['DAY_CLOSED', 409, 'Ese día ya está cerrado: sus tareas no se pueden cambiar.'],
    ['DAY_NOT_STARTED', 409, 'Solo puedes completar tareas de hoy.'],
    ['TASK_NOT_FOUND', 404, 'Esta tarea ya no existe. Puede que se eliminara desde otra pestaña.'],
  ])('RF-42 y RF-45: con %s explica el motivo, sin reintentar', async (code, status, message) => {
    mockApi({ 'PATCH /tasks/t1': () => apiFail(status, code) });
    const { result } = setup();
    act(() => {
      result.current.toggleCompleted(task('t1'));
    });
    await waitFor(() => {
      expect(result.current.error).toBe(message);
    });
    expect(result.current.retry).toBeUndefined();
  });

  it('RF-44: si falla sin conexión ofrece reintentar el mismo cambio, que limpia el error al salir bien', async () => {
    let calls = 0;
    const api = mockApi({
      'PATCH /tasks/t1': () => {
        calls += 1;
        return calls === 1 ? Promise.reject(new TypeError('Failed to fetch')) : apiOk(task('t1', true));
      },
    });
    const { result } = setup();
    act(() => {
      result.current.toggleCompleted(task('t1'));
    });
    await waitFor(() => {
      expect(result.current.error).toBe('No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.');
    });
    act(() => {
      result.current.retry?.();
    });
    await waitFor(() => {
      expect(result.current.error).toBeUndefined();
    });
    expect(await api.bodyOf('PATCH /tasks/t1', 1)).toEqual({ completed: true });
  });

  it('el error se puede cerrar', async () => {
    mockApi({ 'PATCH /tasks/t1': () => apiFail(409, 'DAY_CLOSED') });
    const { result } = setup();
    act(() => {
      result.current.toggleCompleted(task('t1'));
    });
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
    act(() => {
      result.current.dismissError();
    });
    expect(result.current.error).toBeUndefined();
  });

  it('RF-23: pedir eliminar guarda la tarea que hay que confirmar, sin llamar a la API; cancelar la olvida', () => {
    const api = mockApi({});
    const { result } = setup();
    act(() => {
      result.current.requestDelete(task('t1'));
    });
    expect(result.current.pendingDelete).toEqual(task('t1'));
    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.pendingDelete).toBeUndefined();
    expect(api.requests).toHaveLength(0);
  });

  it('RF-24: confirmar elimina la tarea y cierra la confirmación', async () => {
    const api = mockApi({ 'DELETE /tasks/t1': () => apiOk(null) });
    const { result } = setup();
    act(() => {
      result.current.requestDelete(task('t1'));
    });
    act(() => {
      result.current.confirmDelete();
    });
    expect(result.current.isDeleting).toBe(true);
    await waitFor(() => {
      expect(result.current.pendingDelete).toBeUndefined();
    });
    expect(result.current.isDeleting).toBe(false);
    expect(api.requests.map((request) => request.method)).toEqual(['DELETE']);
  });

  it('RF-19: confirmar dos veces seguidas elimina una sola vez', async () => {
    const api = mockApi({ 'DELETE /tasks/t1': () => apiOk(null) });
    const { result } = setup();
    act(() => {
      result.current.requestDelete(task('t1'));
    });
    act(() => {
      result.current.confirmDelete();
      result.current.confirmDelete();
    });
    await waitFor(() => {
      expect(result.current.pendingDelete).toBeUndefined();
    });
    expect(api.requests).toHaveLength(1);
  });

  it('RF-42: si el día ya está cerrado, cierra la confirmación y lo explica', async () => {
    mockApi({ 'DELETE /tasks/t1': () => apiFail(409, 'DAY_CLOSED') });
    const { result } = setup();
    act(() => {
      result.current.requestDelete(task('t1'));
    });
    act(() => {
      result.current.confirmDelete();
    });
    await waitFor(() => {
      expect(result.current.error).toBe('Ese día ya está cerrado: sus tareas no se pueden cambiar.');
    });
    expect(result.current.pendingDelete).toBeUndefined();
    expect(result.current.retry).toBeUndefined();
  });

  it('RF-44: sin conexión ofrece reintentar la eliminación ya confirmada', async () => {
    let calls = 0;
    const api = mockApi({
      'DELETE /tasks/t1': () => {
        calls += 1;
        return calls === 1 ? Promise.reject(new TypeError('Failed to fetch')) : apiOk(null);
      },
    });
    const { result } = setup();
    act(() => {
      result.current.requestDelete(task('t1'));
    });
    act(() => {
      result.current.confirmDelete();
    });
    await waitFor(() => {
      expect(result.current.retry).toBeDefined();
    });
    act(() => {
      result.current.retry?.();
    });
    await waitFor(() => {
      expect(result.current.error).toBeUndefined();
    });
    expect(api.requests).toHaveLength(2);
  });
});
