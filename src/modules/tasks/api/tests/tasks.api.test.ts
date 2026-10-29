/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { toApiError } from '../../../../shared/api/api-error.util';
import { baseApi } from '../../../../shared/api/base.api';
import { createAppStore, type AppStore } from '../../../../shared/store/store';
import { tasksApi } from '../tasks.api';

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

function page(items: unknown[], pageNumber: number, totalPages: number, totalItems = items.length) {
  return apiOk({ items, page: pageNumber, pageSize: 100, totalItems, totalPages });
}

function queryOf(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

let store: AppStore;

beforeEach(() => {
  store = createAppStore();
});

// Sin cachés ni temporizadores de RTK Query pendientes al terminar cada test
afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  jest.restoreAllMocks();
});

function fetchWeek() {
  return store.dispatch(tasksApi.endpoints.getWeekTasks.initiate('2026-10-29', { subscribe: false }));
}

describe('D-5: tasksApi.getWeekTasks', () => {
  it('RF-09: pide los 7 días de la semana (from y to incluidos) con pageSize=100', async () => {
    const api = mockApi({ 'GET /tasks': () => page([task('a', '2026-10-29')], 1, 1) });
    const result = await fetchWeek();

    expect(result.data).toEqual([task('a', '2026-10-29')]);
    expect(api.requests).toHaveLength(1);
    expect(queryOf(api.requests[0] ?? new Request('http://x'))).toEqual({
      from: '2026-10-29',
      to: '2026-11-04',
      page: '1',
      pageSize: '100',
    });
  });

  it('envía la hora y la zona horaria del dispositivo (API-002 RF-30)', async () => {
    const api = mockApi({ 'GET /tasks': () => page([], 1, 0) });
    await fetchWeek();
    expect(api.requests[0]?.headers.get('X-Client-Time')).not.toBeNull();
    expect(api.requests[0]?.headers.get('X-Timezone')).not.toBeNull();
  });

  it('R-4: con totalPages > 1 pide el resto de páginas y las concatena en orden', async () => {
    const pages = [
      [task('a', '2026-10-29'), task('b', '2026-10-29')],
      [task('c', '2026-10-30')],
      [task('d', '2026-11-04', true)],
    ];
    const api = mockApi({
      'GET /tasks': (request) => {
        const pageNumber = Number(queryOf(request).page);
        return page(pages[pageNumber - 1] ?? [], pageNumber, pages.length, 4);
      },
    });
    const result = await fetchWeek();

    expect(result.data?.map((item) => item.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(api.requests.map((request) => queryOf(request).page).sort()).toEqual(['1', '2', '3']);
  });

  it('una semana sin tareas (totalPages 0) es una lista vacía sin más peticiones', async () => {
    const api = mockApi({ 'GET /tasks': () => page([], 1, 0) });
    const result = await fetchWeek();
    expect(result.data).toEqual([]);
    expect(api.requests).toHaveLength(1);
  });

  it('RF-44: si falla una de las páginas siguientes, la consulta entera es un error', async () => {
    mockApi({
      'GET /tasks': (request) =>
        queryOf(request).page === '1' ? page([task('a', '2026-10-29')], 1, 2, 2) : apiFail(500, 'INTERNAL_ERROR'),
    });
    const result = await fetchWeek();
    expect(result.data).toBeUndefined();
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });

  it('RF-43: el error de la API llega con su código', async () => {
    mockApi({ 'GET /tasks': () => apiFail(400, 'INVALID_CLIENT_TIME') });
    const result = await fetchWeek();
    expect(toApiError(result.error).code).toBe('INVALID_CLIENT_TIME');
  });

  it('RF-44: una respuesta fuera de contrato es INTERNAL_ERROR', async () => {
    mockApi({ 'GET /tasks': () => apiOk({ items: [{ id: 'a' }], page: 1, pageSize: 100, totalItems: 1, totalPages: 1 }) });
    const result = await fetchWeek();
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });
});
