import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { addDays, todayKey } from '@shared/date/day.util';
import { pomodoroFixture } from '../../tests/pomodoro.fixtures';
import { useStartSessionForm } from '../use-start-session-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => useStartSessionForm(), { wrapper: appWrapper(store, '/pomodoro') });
}

type View = ReturnType<typeof setup>['result'];

async function submit(result: View) {
  await act(async () => {
    result.current.onSubmit();
    await Promise.resolve();
  });
}

function addTask(result: View, title: string, description = '') {
  act(() => {
    result.current.rows.add();
  });
  const index = result.current.rows.rows.length - 1;
  act(() => {
    result.current.form.setValue(`newTasks.${String(index)}.title` as 'newTasks.0.title', title);
    result.current.form.setValue(`newTasks.${String(index)}.description` as 'newTasks.0.description', description);
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useStartSessionForm', () => {
  it('RF-06: propone 25 minutos, sin tareas y sin «Otra»', () => {
    const { result } = setup();
    expect(result.current.form.getValues()).toEqual({
      duration: '25',
      customMinutes: '',
      newTasks: [],
      waitingTaskIds: [],
    });
    expect(result.current.isCustomDuration).toBe(false);
  });

  it('RF-10: cada tarea nueva propone la fecha de hoy; se puede quitar una fila', () => {
    const { result } = setup();
    act(() => {
      result.current.rows.add();
      result.current.rows.add();
    });
    expect(result.current.form.getValues('newTasks')).toEqual([
      { title: '', description: '', date: todayKey() },
      { title: '', description: '', date: todayKey() },
    ]);
    expect(result.current.rows.minDate).toBe(todayKey());
    act(() => {
      result.current.rows.remove(0);
    });
    expect(result.current.rows.rows).toHaveLength(1);
  });

  it('RF-13: deja de ofrecer añadir tareas al llegar a 20', () => {
    const { result } = setup();
    act(() => {
      for (let index = 0; index < 19; index += 1) result.current.rows.add();
    });
    expect(result.current.rows.canAdd).toBe(true);
    act(() => {
      result.current.rows.add();
    });
    expect(result.current.rows.canAdd).toBe(false);
  });

  it('RF-14 y RF-56: envía la duración elegida y las tareas sin espacios, con la descripción vacía como null', async () => {
    const api = mockApi({ 'POST /pomodoros': () => apiOk(pomodoroFixture(), 201), 'GET /pomodoros': () => apiOk({}) });
    const { result } = setup();
    act(() => {
      result.current.form.setValue('duration', '45');
    });
    addTask(result, '  Repasar el tema 3 ');
    addTask(result, 'Llamar a Marta', ' Antes de comer ');

    await submit(result);

    await waitFor(() => {
      expect(api.requests).not.toHaveLength(0);
    });
    expect(await api.bodyOf('POST /pomodoros')).toEqual({
      durationMinutes: 45,
      newTasks: [
        { title: 'Repasar el tema 3', description: null, date: todayKey() },
        { title: 'Llamar a Marta', description: 'Antes de comer', date: todayKey() },
      ],
      waitingTaskIds: [],
    });
    await waitFor(() => {
      expect(result.current.form.getValues('newTasks')).toEqual([]);
    });
  });

  it('RF-55 y RF-56: con «Otra» envía los minutos del campo', async () => {
    const api = mockApi({ 'POST /pomodoros': () => apiOk(pomodoroFixture(), 201) });
    const { result } = setup();
    act(() => {
      result.current.form.setValue('duration', 'custom');
      result.current.form.setValue('customMinutes', ' 1 ');
    });
    expect(result.current.isCustomDuration).toBe(true);

    await submit(result);

    await waitFor(async () => {
      expect(await api.bodyOf('POST /pomodoros')).toMatchObject({ durationMinutes: 1 });
    });
  });

  it('RF-07 y RF-11: con campos no válidos muestra los errores y no envía nada', async () => {
    const api = mockApi({});
    const { result } = setup();
    act(() => {
      result.current.form.setValue('duration', 'custom');
      result.current.form.setValue('customMinutes', '121');
    });
    addTask(result, 'Repasar');
    act(() => {
      result.current.form.setValue('newTasks.0.date', addDays(todayKey(), -1));
    });

    await submit(result);

    await waitFor(() => {
      expect(result.current.form.formState.errors.customMinutes?.message).toBe('Elige entre 1 y 120 minutos.');
    });
    expect(result.current.rows.errorOf(0, 'date')).toBe('Elige hoy o un día posterior.');
    expect(api.requests).toHaveLength(0);
  });

  it.each([
    ['DAY_CLOSED', 'Ese día ya está cerrado: sus tareas no se pueden cambiar.'],
    ['POMODORO_TASK_NOT_FOUND', 'Alguna de las tareas ya no existe o ya no está en espera. Revisa la lista.'],
  ])('RF-47: con %s muestra el mensaje y conserva lo escrito', async (code, message) => {
    mockApi({ 'POST /pomodoros': () => apiFail(409, code) });
    const { result } = setup();
    addTask(result, 'Repasar');

    await submit(result);

    await waitFor(() => {
      expect(result.current.formError).toBe(message);
    });
    expect(result.current.form.getValues('newTasks.0.title')).toBe('Repasar');
  });

  it('RF-46: con POMODORO_ALREADY_ACTIVE no muestra error en el formulario (la pantalla pasa a la sesión activa)', async () => {
    const api = mockApi({ 'POST /pomodoros': () => apiFail(409, 'POMODORO_ALREADY_ACTIVE') });
    const { result } = setup();

    await submit(result);

    await waitFor(() => {
      expect(api.requests).toHaveLength(1);
    });
    expect(result.current.formError).toBeUndefined();
  });

  it('RF-19 (001): un doble envío solo empieza una sesión', async () => {
    const api = mockApi({ 'POST /pomodoros': () => apiOk(pomodoroFixture(), 201) });
    const { result } = setup();
    await act(async () => {
      result.current.onSubmit();
      result.current.onSubmit();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(1);
    });
  });
});
