/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { toApiError } from '../../../../shared/api/api-error.util';
import { baseApi } from '../../../../shared/api/base.api';
import { createAppStore, type AppStore } from '../../../../shared/store/store';
import { sessionStarted } from '../../../auth';
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

describe('D-5: tasksApi.createTask', () => {
  const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
  const VALUES = { title: 'Comprar pan', description: '', date: '2026-10-30' };

  beforeEach(() => {
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  });

  it('RF-15: envía POST /tasks con el token CSRF de la sesión y la descripción vacía como null', async () => {
    const api = mockApi({ 'POST /tasks': () => apiOk(task('n', '2026-10-30'), 201) });
    const result = await store.dispatch(tasksApi.endpoints.createTask.initiate(VALUES));
    expect(result.data).toEqual(task('n', '2026-10-30'));
    expect(api.requests[0]?.headers.get('X-CSRF-Token')).toBe('sesion-1');
    expect(api.requests[0]?.headers.get('X-Client-Time')).not.toBeNull();
    expect(await api.bodyOf('POST /tasks')).toEqual({ title: 'Comprar pan', description: null, date: '2026-10-30' });
  });

  it('envía la descripción cuando la hay', async () => {
    const api = mockApi({ 'POST /tasks': () => apiOk(task('n', '2026-10-30'), 201) });
    await store.dispatch(tasksApi.endpoints.createTask.initiate({ ...VALUES, description: 'Integral' }));
    expect(await api.bodyOf('POST /tasks')).toEqual({ title: 'Comprar pan', description: 'Integral', date: '2026-10-30' });
  });

  it('RF-18: al crear invalida la semana en caché, que se vuelve a pedir', async () => {
    let created = false;
    const api = mockApi({
      'GET /tasks': () => page(created ? [task('n', '2026-10-30')] : [], 1, created ? 1 : 0),
      'POST /tasks': () => {
        created = true;
        return apiOk(task('n', '2026-10-30'), 201);
      },
    });
    const week = store.dispatch(tasksApi.endpoints.getWeekTasks.initiate('2026-10-29'));
    await week;
    await store.dispatch(tasksApi.endpoints.createTask.initiate(VALUES));
    // La invalidación lanza la nueva consulta: se espera a las que estén en curso
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.all(store.dispatch(tasksApi.util.getRunningQueriesThunk()));
    expect(tasksApi.endpoints.getWeekTasks.select('2026-10-29')(store.getState()).data).toHaveLength(1);
    week.unsubscribe();
    expect(api.requests.filter((request) => request.method === 'GET')).toHaveLength(2);
  });

  it('RF-41: un error de la API llega con su código y sus campos', async () => {
    mockApi({
      'POST /tasks': () => apiFail(400, 'VALIDATION_ERROR', [{ field: 'title', message: 'Título no válido.' }]),
    });
    const result = await store.dispatch(tasksApi.endpoints.createTask.initiate(VALUES));
    expect(toApiError(result.error)).toEqual({ code: 'VALIDATION_ERROR', fieldErrors: { title: 'Título no válido.' } });
  });
});
