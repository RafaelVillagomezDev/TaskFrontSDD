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
    mockApi({
      'GET /tasks': () => apiOk({ items: [{ id: 'a' }], page: 1, pageSize: 100, totalItems: 1, totalPages: 1 }),
    });
    const result = await fetchWeek();
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });
});

describe('D-5: tasksApi.getDayTasks', () => {
  it('RF-26: pide solo las tareas de un día con date, sin from ni to', async () => {
    const api = mockApi({ 'GET /tasks': () => page([task('a', '2026-10-29')], 1, 1) });
    const result = await store.dispatch(tasksApi.endpoints.getDayTasks.initiate('2026-10-29', { subscribe: false }));
    expect(result.data).toEqual([task('a', '2026-10-29')]);
    expect(queryOf(api.requests[0] ?? new Request('http://x'))).toEqual({
      date: '2026-10-29',
      page: '1',
      pageSize: '100',
    });
  });
});

describe('D-5: tasksApi.getTasks (historial)', () => {
  const QUERY = { status: 'all', from: '', to: '', page: 1 } as const;

  it('RF-31 y RF-34: pide la página con pageSize=50, sin fechas vacías, y devuelve los datos de paginación', async () => {
    const api = mockApi({
      'GET /tasks': () =>
        apiOk({ items: [task('a', '2026-10-29')], page: 1, pageSize: 50, totalItems: 1, totalPages: 1 }),
    });
    const result = await store.dispatch(tasksApi.endpoints.getTasks.initiate(QUERY, { subscribe: false }));
    expect(result.data).toEqual({
      items: [task('a', '2026-10-29')],
      page: 1,
      pageSize: 50,
      totalItems: 1,
      totalPages: 1,
    });
    expect(queryOf(api.requests[0] ?? new Request('http://x'))).toEqual({ status: 'all', page: '1', pageSize: '50' });
  });

  it('RF-32: envía el estado y el rango', async () => {
    const api = mockApi({ 'GET /tasks': () => page([], 2, 0) });
    await store.dispatch(
      tasksApi.endpoints.getTasks.initiate(
        { status: 'pending', from: '2026-10-01', to: '2026-10-31', page: 2 },
        { subscribe: false },
      ),
    );
    expect(queryOf(api.requests[0] ?? new Request('http://x'))).toEqual({
      status: 'pending',
      from: '2026-10-01',
      to: '2026-10-31',
      page: '2',
      pageSize: '50',
    });
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
    expect(await api.bodyOf('POST /tasks')).toEqual({
      title: 'Comprar pan',
      description: 'Integral',
      date: '2026-10-30',
    });
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
    expect(toApiError(result.error)).toEqual({ code: 'VALIDATION_ERROR', invalidFields: ['title'] });
  });
});

describe('D-7: tasksApi.updateTask (completar y desmarcar)', () => {
  const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
  const WEEK = '2026-10-29';

  beforeEach(() => {
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  });

  function cachedWeek() {
    return tasksApi.endpoints.getWeekTasks.select(WEEK)(store.getState()).data;
  }

  // Carga la semana y devuelve cómo dejar de observarla (devolver la petición la desenvolvería, es thenable)
  async function loadWeek() {
    const week = store.dispatch(tasksApi.endpoints.getWeekTasks.initiate(WEEK));
    await week;
    return {
      unsubscribe: () => {
        week.unsubscribe();
      },
    };
  }

  async function settle() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.all(store.dispatch(tasksApi.util.getRunningQueriesThunk()));
  }

  it('RF-20: envía PATCH /tasks/{id} con completed y el token CSRF', async () => {
    const api = mockApi({ 'PATCH /tasks/t1': () => apiOk(task('t1', WEEK, true)) });
    const result = await store.dispatch(
      tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: true } }),
    );
    expect(result.data).toEqual(task('t1', WEEK, true));
    expect(api.requests[0]?.headers.get('X-CSRF-Token')).toBe('sesion-1');
    expect(api.requests[0]?.headers.get('X-Client-Time')).not.toBeNull();
    expect(await api.bodyOf('PATCH /tasks/t1')).toEqual({ completed: true });
  });

  it('RF-20 y D-7: la semana en caché la muestra completada antes de que responda la API, sin volver a pedirla', async () => {
    let release: (response: Response) => void = () => undefined;
    const api = mockApi({
      'GET /tasks': () => page([task('t1', WEEK), task('t2', WEEK)], 1, 1),
      'PATCH /tasks/t1': () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    });
    const week = await loadWeek();
    const update = store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: true } }));
    expect(cachedWeek()?.map((item) => item.completed)).toEqual([true, false]);

    // La petición llega a fetch en un turno posterior: se espera a ella antes de responder
    while (!api.requests.some((request) => request.method === 'PATCH')) await settle();
    release(apiOk(task('t1', WEEK, true)));
    await update;
    await settle();
    expect(cachedWeek()?.map((item) => item.completed)).toEqual([true, false]);
    expect(api.requests.filter((request) => request.method === 'GET')).toHaveLength(1);
    week.unsubscribe();
  });

  it('RF-21: desmarcar la vuelve a pendiente en la caché', async () => {
    mockApi({
      'GET /tasks': () => page([task('t1', WEEK, true)], 1, 1),
      'PATCH /tasks/t1': () => apiOk(task('t1', WEEK)),
    });
    const week = await loadWeek();
    await store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: false } }));
    expect(cachedWeek()?.[0]?.completed).toBe(false);
    week.unsubscribe();
  });

  it('RF-26 y D-7: también cambia el día en caché, del que sale el progreso de hoy fuera de la semana actual', async () => {
    mockApi({
      'GET /tasks': () => page([task('t1', WEEK)], 1, 1),
      'PATCH /tasks/t1': () => apiOk(task('t1', WEEK, true)),
    });
    const day = store.dispatch(tasksApi.endpoints.getDayTasks.initiate(WEEK));
    await day;
    await store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: true } }));
    expect(tasksApi.endpoints.getDayTasks.select(WEEK)(store.getState()).data?.[0]?.completed).toBe(true);
    day.unsubscribe();
  });

  // Bug del 2026-10-31 (T116): tras completar o desmarcar, el historial en caché seguía mostrando el estado anterior
  describe('RF-31 (T116): el historial en caché se vuelve a pedir al completar o desmarcar', () => {
    const HISTORY = { status: 'all', from: '', to: '', page: 1 } as const;

    function historyRequests(api: { requests: Request[] }): Request[] {
      return api.requests.filter(
        (request) => request.method === 'GET' && new URL(request.url).searchParams.get('pageSize') === '50',
      );
    }

    it.each([true, false])(
      'RF-31: con completed: %s, el historial que se está viendo se refresca',
      async (completed) => {
        const api = mockApi({
          'GET /tasks': () =>
            apiOk({ items: [task('t1', WEEK, !completed)], page: 1, pageSize: 50, totalItems: 1, totalPages: 1 }),
          'PATCH /tasks/t1': () => apiOk(task('t1', WEEK, completed)),
        });
        const history = store.dispatch(tasksApi.endpoints.getTasks.initiate(HISTORY));
        await history;
        await store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed } }));
        await settle();
        expect(historyRequests(api)).toHaveLength(2);
        history.unsubscribe();
      },
    );

    it('RF-31: un historial en caché que ya no se ve se vuelve a pedir al volver a él', async () => {
      let completed = false;
      const api = mockApi({
        'GET /tasks': () =>
          apiOk({ items: [task('t1', WEEK, completed)], page: 1, pageSize: 50, totalItems: 1, totalPages: 1 }),
        'PATCH /tasks/t1': () => {
          completed = true;
          return apiOk(task('t1', WEEK, true));
        },
      });
      // Se visita el historial y se sale de él: su caché queda guardada sin suscriptores
      const visit = store.dispatch(tasksApi.endpoints.getTasks.initiate(HISTORY));
      await visit;
      visit.unsubscribe();
      await store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: true } }));
      await settle();
      // Se vuelve al historial
      const back = store.dispatch(tasksApi.endpoints.getTasks.initiate(HISTORY));
      const result = await back;
      expect(result.data?.items[0]?.completed).toBe(true);
      expect(historyRequests(api)).toHaveLength(2);
      back.unsubscribe();
    });

    it.each([
      ['editar', 'PATCH', { title: 'Otro título' }],
      ['eliminar', 'DELETE', undefined],
    ])(
      'RF-31: %s también refresca el historial (invalida la etiqueta general Task)',
      async (_case, method, changes) => {
        const api = mockApi({
          'GET /tasks': () => apiOk({ items: [task('t1', WEEK)], page: 1, pageSize: 50, totalItems: 1, totalPages: 1 }),
          'PATCH /tasks/t1': () => apiOk({ ...task('t1', WEEK), title: 'Otro título' }),
          'DELETE /tasks/t1': () => apiOk(null),
        });
        const history = store.dispatch(tasksApi.endpoints.getTasks.initiate(HISTORY));
        await history;
        if (method === 'PATCH' && changes !== undefined) {
          await store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes }));
        } else {
          await store.dispatch(tasksApi.endpoints.deleteTask.initiate('t1'));
        }
        await settle();
        expect(historyRequests(api)).toHaveLength(2);
        history.unsubscribe();
      },
    );

    it('D-7: la semana en caché no se vuelve a pedir: ya tiene el cambio optimista', async () => {
      const api = mockApi({
        'GET /tasks': () => page([task('t1', WEEK)], 1, 1),
        'PATCH /tasks/t1': () => apiOk(task('t1', WEEK, true)),
      });
      const week = await loadWeek();
      await store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: true } }));
      await settle();
      expect(api.requests.filter((request) => request.method === 'GET')).toHaveLength(1);
      week.unsubscribe();
    });
  });

  it('D-7: si la API rechaza, deshace el cambio optimista', async () => {
    mockApi({
      'GET /tasks': () => page([task('t1', WEEK)], 1, 1),
      'PATCH /tasks/t1': () => apiFail(500, 'INTERNAL_ERROR'),
    });
    const week = await loadWeek();
    const result = await store.dispatch(
      tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: true } }),
    );
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
    expect(cachedWeek()?.[0]?.completed).toBe(false);
    week.unsubscribe();
  });

  it.each(['DAY_CLOSED', 'DAY_NOT_STARTED', 'TASK_NOT_FOUND'])(
    'RF-42 y RF-45: con %s vuelve a pedir la semana para mostrar el estado real',
    async (code) => {
      let calls = 0;
      const api = mockApi({
        'GET /tasks': () => {
          calls += 1;
          return page(calls === 1 ? [task('t1', WEEK)] : [], 1, calls === 1 ? 1 : 0);
        },
        'PATCH /tasks/t1': () => apiFail(code === 'TASK_NOT_FOUND' ? 404 : 409, code),
      });
      const week = await loadWeek();
      await store.dispatch(tasksApi.endpoints.updateTask.initiate({ id: 't1', changes: { completed: true } }));
      await settle();
      expect(api.requests.filter((request) => request.method === 'GET')).toHaveLength(2);
      expect(cachedWeek()).toEqual([]);
      week.unsubscribe();
    },
  );
});

describe('D-7: tasksApi.deleteTask', () => {
  const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
  const WEEK = '2026-10-29';

  beforeEach(() => {
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  });

  async function settle() {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.all(store.dispatch(tasksApi.util.getRunningQueriesThunk()));
  }

  it('RF-24: envía DELETE /tasks/{id} con el token CSRF y la semana se vuelve a pedir sin ella', async () => {
    let deleted = false;
    const api = mockApi({
      'GET /tasks': () => page(deleted ? [] : [task('t1', WEEK)], 1, deleted ? 0 : 1),
      'DELETE /tasks/t1': () => {
        deleted = true;
        return apiOk(null);
      },
    });
    const week = store.dispatch(tasksApi.endpoints.getWeekTasks.initiate(WEEK));
    await week;
    const result = await store.dispatch(tasksApi.endpoints.deleteTask.initiate('t1'));
    expect(result.error).toBeUndefined();
    expect(api.requests.find((request) => request.method === 'DELETE')?.headers.get('X-CSRF-Token')).toBe('sesion-1');
    await settle();
    expect(tasksApi.endpoints.getWeekTasks.select(WEEK)(store.getState()).data).toEqual([]);
    week.unsubscribe();
  });

  it('RF-45: si la tarea ya no existe, la semana también se vuelve a pedir', async () => {
    const api = mockApi({
      'GET /tasks': () => page([], 1, 0),
      'DELETE /tasks/t1': () => apiFail(404, 'TASK_NOT_FOUND'),
    });
    const week = store.dispatch(tasksApi.endpoints.getWeekTasks.initiate(WEEK));
    await week;
    const result = await store.dispatch(tasksApi.endpoints.deleteTask.initiate('t1'));
    expect(toApiError(result.error).code).toBe('TASK_NOT_FOUND');
    await settle();
    expect(api.requests.filter((request) => request.method === 'GET')).toHaveLength(2);
    week.unsubscribe();
  });

  it('RF-44: un fallo inesperado no vuelve a pedir la semana', async () => {
    const api = mockApi({
      'GET /tasks': () => page([task('t1', WEEK)], 1, 1),
      'DELETE /tasks/t1': () => apiFail(500, 'INTERNAL_ERROR'),
    });
    const week = store.dispatch(tasksApi.endpoints.getWeekTasks.initiate(WEEK));
    await week;
    await store.dispatch(tasksApi.endpoints.deleteTask.initiate('t1'));
    await settle();
    expect(api.requests.filter((request) => request.method === 'GET')).toHaveLength(1);
    week.unsubscribe();
  });
});
