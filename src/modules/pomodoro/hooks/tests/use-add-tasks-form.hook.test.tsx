import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { todayKey } from '@shared/date/day.util';
import type { Pomodoro } from '../../schemas/pomodoro.schema';
import { pomodoroFixture, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { useAddTasksForm } from '../use-add-tasks-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup(session: Pomodoro = pomodoroFixture()) {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => useAddTasksForm(session), { wrapper: appWrapper(store, '/pomodoro') });
}

type View = ReturnType<typeof setup>['result'];

async function submit(result: View) {
  await act(async () => {
    result.current.onSubmit();
    await Promise.resolve();
  });
}

function sessionWith(count: number): Pomodoro {
  return pomodoroFixture({
    tasks: Array.from({ length: count }, (_, index) => pomodoroTaskFixture({ id: `t-${String(index)}` })),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useAddTasksForm', () => {
  it('RF-29: se abre con una fila vacía con la fecha de hoy', () => {
    const { result } = setup();
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.form.getValues('newTasks')).toEqual([{ title: '', description: '', date: todayKey() }]);
  });

  it('RF-13 y RF-29: no se ofrece con 20 tareas y no deja añadir filas por encima de 20', () => {
    expect(setup(sessionWith(20)).result.current.canOpen).toBe(false);
    const { result } = setup(sessionWith(19));
    expect(result.current.canOpen).toBe(true);
    act(() => {
      result.current.open();
    });
    expect(result.current.rows.canAdd).toBe(false);
  });

  it('RF-29: añade las tareas a la sesión y cierra el diálogo', async () => {
    const api = mockApi({ 'POST /pomodoros/p-1/tasks': () => apiOk(sessionWith(2)) });
    const { result } = setup();
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.form.setValue('newTasks.0.title', ' Llamar a Marta ');
    });

    await submit(result);

    await waitFor(async () => {
      expect(await api.bodyOf('POST /pomodoros/p-1/tasks')).toEqual({
        newTasks: [{ title: 'Llamar a Marta', description: null, date: todayKey() }],
        waitingTaskIds: [],
      });
    });
    await waitFor(() => {
      expect(result.current.isOpen).toBe(false);
    });
  });

  it('RF-29: sin ninguna tarea muestra el error y no llama a la API', async () => {
    const api = mockApi({});
    const { result } = setup();
    act(() => {
      result.current.open();
      result.current.rows.remove(0);
    });
    await submit(result);
    await waitFor(() => {
      expect(result.current.rows.listError).toBe('Añade al menos una tarea.');
    });
    expect(api.requests).toHaveLength(0);
  });

  it('RF-47 y RF-48: con POMODORO_TASK_LIMIT muestra el mensaje y conserva lo escrito', async () => {
    mockApi({ 'POST /pomodoros/p-1/tasks': () => apiFail(409, 'POMODORO_TASK_LIMIT') });
    const { result } = setup();
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.form.setValue('newTasks.0.title', 'Llamar');
    });

    await submit(result);

    await waitFor(() => {
      expect(result.current.formError).toBe('Una sesión puede tener como máximo 20 tareas.');
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.form.getValues('newTasks.0.title')).toBe('Llamar');
  });
});
