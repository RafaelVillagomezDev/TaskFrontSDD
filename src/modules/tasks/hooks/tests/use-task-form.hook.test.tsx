import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { useTaskForm } from '../use-task-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const WEEK = { today: '2026-10-29', weekStart: '2026-10-29', weekEnd: '2026-11-04' };

function created(date: string) {
  return apiOk(
    {
      id: 'n',
      title: 'Comprar pan',
      description: null,
      date,
      completed: false,
      createdAt: '2026-10-29T09:15:00Z',
      updatedAt: '2026-10-29T09:15:00Z',
    },
    201,
  );
}

function setup(week = WEEK) {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  const view = renderHook(() => useTaskForm(week), { wrapper: appWrapper(store, '/') });
  return { ...view, store };
}

type View = ReturnType<typeof setup>['result'];

function openAndFill(result: View, values: { title: string; description?: string; date?: string }, day = '2026-10-30') {
  act(() => {
    result.current.openFor(day);
  });
  act(() => {
    result.current.form.setValue('title', values.title);
    result.current.form.setValue('description', values.description ?? '');
    if (values.date !== undefined) result.current.form.setValue('date', values.date);
  });
}

async function submit(result: View) {
  await act(async () => {
    result.current.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useTaskForm (crear)', () => {
  it('RF-15: al abrir desde una columna propone su fecha, con el formulario vacío', () => {
    const { result } = setup();
    expect(result.current.isOpen).toBe(false);
    act(() => {
      result.current.openFor('2026-10-31');
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.form.getValues()).toEqual({ title: '', description: '', date: '2026-10-31' });
    expect(result.current.minDate).toBe('2026-10-29');
  });

  it('RF-17: cuenta los caracteres del título y la descripción sin los espacios de los extremos', () => {
    const { result } = setup();
    openAndFill(result, { title: '  Pan  ', description: ' Integral' });
    expect(result.current.counters).toEqual({ title: 3, description: 8 });
  });

  it('RF-02: con campos no válidos muestra los errores y no envía nada', async () => {
    const api = mockApi({});
    const { result } = setup();
    openAndFill(result, { title: '   ', date: '2026-10-28' });
    await submit(result);
    await waitFor(() => {
      expect(result.current.form.formState.errors.title?.message).toBe('Escribe un título.');
    });
    expect(result.current.form.formState.errors.date?.message).toBe('Elige hoy o un día posterior.');
    expect(api.requests).toHaveLength(0);
    expect(result.current.isOpen).toBe(true);
  });

  it('RF-18: con fecha dentro de la semana visible crea la tarea y cierra sin aviso', async () => {
    const api = mockApi({ 'POST /tasks': () => created('2026-10-30') });
    const { result } = setup();
    openAndFill(result, { title: ' Comprar pan ' });
    await submit(result);
    await waitFor(() => {
      expect(result.current.isOpen).toBe(false);
    });
    expect(await api.bodyOf('POST /tasks')).toEqual({ title: 'Comprar pan', description: null, date: '2026-10-30' });
    expect(result.current.notice).toBeUndefined();
  });

  it('RF-52: con fecha fuera de la semana visible confirma la creación con su fecha', async () => {
    mockApi({ 'POST /tasks': () => created('2026-11-12') });
    const { result } = setup();
    openAndFill(result, { title: 'Comprar pan', date: '2026-11-12' });
    await submit(result);
    await waitFor(() => {
      expect(result.current.notice).toBe('Tarea creada para el jueves, 12 de noviembre de 2026.');
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('RF-52: el aviso desaparece al abrir otra vez el formulario', async () => {
    mockApi({ 'POST /tasks': () => created('2026-11-12') });
    const { result } = setup();
    openAndFill(result, { title: 'Comprar pan', date: '2026-11-12' });
    await submit(result);
    await waitFor(() => {
      expect(result.current.notice).toBeDefined();
    });
    act(() => {
      result.current.openFor('2026-10-29');
    });
    expect(result.current.notice).toBeUndefined();
  });

  it('RF-19: mientras se envía no se puede enviar otra vez', async () => {
    let release: (response: Response) => void = () => undefined;
    const api = mockApi({
      'POST /tasks': () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    });
    const { result } = setup();
    openAndFill(result, { title: 'Comprar pan' });
    await submit(result);
    await submit(result);
    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });
    await submit(result);
    await act(async () => {
      release(created('2026-10-30'));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.isOpen).toBe(false);
    });
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(1);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('RF-41: los errores de campo de la API van bajo su campo y se conserva lo escrito', async () => {
    mockApi({
      'POST /tasks': () => apiFail(400, 'VALIDATION_ERROR', [{ field: 'title', message: 'Título no válido.' }]),
    });
    const { result } = setup();
    openAndFill(result, { title: 'Comprar pan', description: 'Integral' });
    await submit(result);
    await waitFor(() => {
      expect(result.current.form.formState.errors.title?.message).toBe('Título no válido.');
    });
    expect(result.current.formError).toBeUndefined();
    expect(result.current.isOpen).toBe(true);
    expect(result.current.form.getValues('description')).toBe('Integral');
  });

  it('RF-42: si el día ya está cerrado lo explica bajo el formulario', async () => {
    mockApi({ 'POST /tasks': () => apiFail(409, 'DAY_CLOSED') });
    const { result } = setup();
    openAndFill(result, { title: 'Comprar pan' });
    await submit(result);
    await waitFor(() => {
      expect(result.current.formError).toBe('Ese día ya está cerrado: sus tareas no se pueden cambiar.');
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('RF-44: sin conexión muestra el mensaje general', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = setup();
    openAndFill(result, { title: 'Comprar pan' });
    await submit(result);
    await waitFor(() => {
      expect(result.current.formError).toBe(
        'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
      );
    });
  });

  it('cerrar el formulario lo deja cerrado sin enviar nada', () => {
    const api = mockApi({});
    const { result } = setup();
    openAndFill(result, { title: 'Comprar pan' });
    act(() => {
      result.current.onOpenChange(false);
    });
    expect(result.current.isOpen).toBe(false);
    expect(api.requests).toHaveLength(0);
  });
});
