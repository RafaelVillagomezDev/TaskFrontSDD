import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { baseApi } from '../../../../shared/api/base.api';
import { useWeekBoard } from '../use-week-board.hook';

const NOON = new Date(2026, 9, 29, 12, 0, 0);
const NEXT_DAY = new Date(2026, 9, 30, 0, 1, 0);

function task(id: string, date: string, completed = false) {
  return {
    id,
    title: `Tarea ${id}`,
    description: null,
    date,
    completed,
    createdAt: '2026-10-29T09:15:00Z',
    updatedAt: '2026-10-29T09:15:00Z',
  };
}

function weekOf(tasks: ReturnType<typeof task>[]) {
  return () => apiOk({ items: tasks, page: 1, pageSize: 100, totalItems: tasks.length, totalPages: 1 });
}

function fromOf(request: Request | undefined): string | null {
  return request === undefined ? null : new URL(request.url).searchParams.get('from');
}

// Última petición de una semana (from/to); la del progreso de hoy fuera de la semana actual usa date
function lastWeekRequest(requests: Request[]): Request | undefined {
  return requests.filter((request) => new URL(request.url).searchParams.has('from')).at(-1);
}

function setup() {
  const store = freshStore();
  const view = renderHook(() => useWeekBoard(), { wrapper: appWrapper(store, '/') });
  return { ...view, store };
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOON, advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useWeekBoard', () => {
  it('RF-09: 7 columnas desde hoy, con hoy editable y el resto futuras', async () => {
    mockApi({ 'GET /tasks': weekOf([]) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.columns.map((column) => column.day)).toEqual([
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
    ]);
    expect(result.current.columns.map((column) => column.kind)).toEqual([
      'today',
      'future',
      'future',
      'future',
      'future',
      'future',
      'future',
    ]);
    expect(result.current.weekStart).toBe('2026-10-29');
    expect(result.current.weekEnd).toBe('2026-11-04');
    expect(result.current.isCurrentWeek).toBe(true);
  });

  it('RF-10: agrupa por día y separa pendientes y completadas en el orden de la API', async () => {
    mockApi({
      'GET /tasks': weekOf([
        task('a', '2026-10-29', true),
        task('b', '2026-10-29'),
        task('c', '2026-10-29', true),
        task('d', '2026-10-29'),
        task('e', '2026-11-01'),
      ]),
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    const [today, , , sunday] = result.current.columns;
    expect(today?.pending.map((item) => item.id)).toEqual(['b', 'd']);
    expect(today?.completed.map((item) => item.id)).toEqual(['a', 'c']);
    expect(today?.total).toBe(4);
    expect(sunday?.pending.map((item) => item.id)).toEqual(['e']);
    expect(result.current.columns[1]?.total).toBe(0);
  });

  it('RF-12 y RF-13: retroceder muestra los 7 días anteriores, todos en solo lectura', async () => {
    const api = mockApi({ 'GET /tasks': weekOf([]) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    act(() => {
      result.current.goToPreviousWeek();
    });
    expect(result.current.weekStart).toBe('2026-10-22');
    expect(result.current.weekEnd).toBe('2026-10-28');
    expect(result.current.isCurrentWeek).toBe(false);
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.columns.every((column) => column.kind === 'past')).toBe(true);
    expect(fromOf(lastWeekRequest(api.requests))).toBe('2026-10-22');
  });

  it('RF-12 y RF-47: avanzar muestra los 7 días siguientes y «Hoy» vuelve a la semana actual', async () => {
    const api = mockApi({ 'GET /tasks': weekOf([]) });
    const { result } = setup();
    act(() => {
      result.current.goToNextWeek();
    });
    act(() => {
      result.current.goToNextWeek();
    });
    expect(result.current.weekStart).toBe('2026-11-12');
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.columns.every((column) => column.kind === 'future')).toBe(true);
    act(() => {
      result.current.goToToday();
    });
    expect(result.current.weekStart).toBe('2026-10-29');
    expect(result.current.isCurrentWeek).toBe(true);
    await waitFor(() => {
      expect(fromOf(lastWeekRequest(api.requests))).toBe('2026-11-12');
    });
  });

  it('RF-40: mientras carga una semana nueva no muestra las tareas de la anterior', async () => {
    mockApi({ 'GET /tasks': weekOf([task('a', '2026-10-29')]) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    act(() => {
      result.current.goToNextWeek();
    });
    expect(result.current.status).toBe('loading');
    expect(result.current.columns.every((column) => column.total === 0)).toBe(true);
  });

  it('RF-44: si la consulta falla da el mensaje en español y reintenta', async () => {
    let calls = 0;
    mockApi({
      'GET /tasks': () => {
        calls += 1;
        return calls === 1 ? apiFail(500, 'INTERNAL_ERROR') : weekOf([task('a', '2026-10-29')])();
      },
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.errorMessage).toBeUndefined();
    expect(result.current.columns[0]?.total).toBe(1);
  });

  it('RF-14: al cambiar el día, el tablero empieza en el nuevo día e invalida Task y Streak', async () => {
    const api = mockApi({ 'GET /tasks': weekOf([]) });
    const { result, store } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    jest.setSystemTime(NEXT_DAY);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current.weekStart).toBe('2026-10-30');
    expect(result.current.columns[0]?.kind).toBe('today');
    expect(dispatch).toHaveBeenCalledWith(baseApi.util.invalidateTags(['Task', 'Streak']));
    await waitFor(() => {
      expect(fromOf(lastWeekRequest(api.requests))).toBe('2026-10-30');
    });
  });

  it('RF-14: en una semana pasada, al cambiar el día se conserva la distancia a hoy', async () => {
    mockApi({ 'GET /tasks': weekOf([]) });
    const { result } = setup();
    act(() => {
      result.current.goToPreviousWeek();
    });
    jest.setSystemTime(NEXT_DAY);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current.weekStart).toBe('2026-10-23');
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.columns.at(-1)?.kind).toBe('past');
  });

  it('sin cambio de día no invalida nada al volver a la pestaña', async () => {
    mockApi({ 'GET /tasks': weekOf([]) });
    const { result, store } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    const dispatch = jest.spyOn(store, 'dispatch');
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(dispatch).not.toHaveBeenCalledWith(baseApi.util.invalidateTags(['Task', 'Streak']));
  });
  it('RF-26: el progreso de hoy sale de la columna de hoy, sin pedir nada más', async () => {
    const api = mockApi({
      'GET /tasks': weekOf([task('a', '2026-10-29', true), task('b', '2026-10-29'), task('c', '2026-10-30')]),
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.todayProgress).toEqual({ done: 1, total: 2 });
    });
    expect(api.requests).toHaveLength(1);
  });

  it('RF-26: en otra semana, el progreso de hoy pide solo las tareas de hoy', async () => {
    const api = mockApi({
      'GET /tasks': (request) =>
        new URL(request.url).searchParams.get('date') === '2026-10-29'
          ? weekOf([task('a', '2026-10-29')])()
          : weekOf([task('z', '2026-11-05', true)])(),
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.todayProgress).toEqual({ done: 0, total: 0 });
    });
    act(() => {
      result.current.goToNextWeek();
    });
    await waitFor(() => {
      expect(result.current.todayProgress).toEqual({ done: 0, total: 1 });
    });
    const dayRequests = api.requests.filter((request) => new URL(request.url).searchParams.has('date'));
    expect(dayRequests).toHaveLength(1);
    expect(fromOf(dayRequests[0])).toBeNull();
  });

  it('RF-26: sin datos de hoy todavía, no hay progreso', () => {
    mockApi({ 'GET /tasks': () => new Promise<Response>(() => undefined) });
    const { result } = setup();
    expect(result.current.todayProgress).toBeUndefined();
  });
});
