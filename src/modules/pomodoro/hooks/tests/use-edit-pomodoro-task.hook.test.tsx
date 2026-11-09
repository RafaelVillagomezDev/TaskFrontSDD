import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { useEditPomodoroTask } from '../use-edit-pomodoro-task.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => useEditPomodoroTask(), { wrapper: appWrapper(store, '/pomodoro') });
}

type View = ReturnType<typeof setup>['result'];

async function submit(result: View) {
  await act(async () => {
    result.current.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useEditPomodoroTask', () => {
  it('RF-35: se abre con el título y la descripción actuales', () => {
    const { result } = setup();
    act(() => {
      result.current.open(pomodoroTaskFixture({ description: 'Del libro' }));
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.form.getValues()).toEqual({ title: 'Repasar el tema 3', description: 'Del libro' });
  });

  it('RF-35 y RF-36: guarda título y descripción sin la fecha, y cierra', async () => {
    const api = mockApi({ 'PATCH /pomodoro-tasks/t-1': () => apiOk(pomodoroTaskFixture({ title: 'Repasar 3 y 4' })) });
    const { result } = setup();
    act(() => {
      result.current.open(pomodoroTaskFixture({ description: 'Del libro' }));
    });
    act(() => {
      result.current.form.setValue('title', ' Repasar 3 y 4 ');
      result.current.form.setValue('description', '   ');
    });

    await submit(result);

    await waitFor(async () => {
      expect(await api.bodyOf('PATCH /pomodoro-tasks/t-1')).toEqual({ title: 'Repasar 3 y 4', description: null });
    });
    await waitFor(() => {
      expect(result.current.isOpen).toBe(false);
    });
  });

  it('RF-35: un título vacío no se envía', async () => {
    const api = mockApi({});
    const { result } = setup();
    act(() => {
      result.current.open(pomodoroTaskFixture());
    });
    act(() => {
      result.current.form.setValue('title', '');
    });
    await submit(result);
    await waitFor(() => {
      expect(result.current.form.formState.errors.title?.message).toBe('Escribe un título.');
    });
    expect(api.requests).toHaveLength(0);
  });

  it('RF-48: si la sesión ya terminó, muestra el mensaje y sigue abierto', async () => {
    mockApi({ 'PATCH /pomodoro-tasks/t-1': () => apiFail(409, 'INVALID_POMODORO_STATE') });
    const { result } = setup();
    act(() => {
      result.current.open(pomodoroTaskFixture());
    });
    await submit(result);
    await waitFor(() => {
      expect(result.current.formError).toBeDefined();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.onOpenChange(false);
    });
    expect(result.current.isOpen).toBe(false);
  });
});
