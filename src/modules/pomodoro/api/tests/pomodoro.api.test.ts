/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { toApiError } from '@shared/api/api-error.util';
import { baseApi } from '@shared/api/base.api';
import { createAppStore, type AppStore } from '@shared/store/store';
import { pomodoroApi } from '../pomodoro.api';

const TASK = {
  id: 't-1',
  title: 'Repasar el tema 3',
  description: null,
  date: '2026-11-09',
  completed: false,
  completedAt: null,
};

function session(id: string, status: 'running' | 'paused' | 'finished' = 'running') {
  return {
    id,
    durationMinutes: 25,
    status,
    startedAt: '2026-11-09T09:00:00Z',
    endsAt: status === 'running' ? '2026-11-09T09:25:00Z' : null,
    remainingSeconds: status === 'finished' ? 0 : 1500,
    finishedAt: status === 'finished' ? '2026-11-09T09:25:00Z' : null,
    focusedSeconds: status === 'finished' ? 1500 : null,
    endReason: status === 'finished' ? 'manual' : null,
    tasks: [TASK],
    completedTasks: 0,
    totalTasks: 1,
    createdAt: '2026-11-09T09:00:00Z',
  };
}

function page(items: unknown[]) {
  return apiOk({ items, page: 1, pageSize: 20, totalItems: items.length, totalPages: 1 });
}

function count(requests: Request[], method: string, path: string): number {
  return requests.filter((request) => request.method === method && new URL(request.url).pathname === path).length;
}

let store: AppStore;

beforeEach(() => {
  store = createAppStore();
});

afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  jest.restoreAllMocks();
});

// Suscripción viva a la lista de sesiones, para comprobar si una mutación la vuelve a pedir
// (se devuelve envuelta: una función async desenvolvería la suscripción, que también es una promesa)
async function subscribeList(): Promise<{ unsubscribe: () => void }> {
  const subscription = store.dispatch(pomodoroApi.endpoints.getPomodoros.initiate(1));
  await subscription;
  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}

// Deja terminar onQueryStarted (guarda la sesión una vez resuelta la mutación) y las consultas que relanzó
async function settle() {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
}

describe('pomodoroApi: consultas', () => {
  it('RF-03: pide la página indicada de GET /pomodoros con la hora del dispositivo y valida la respuesta', async () => {
    const api = mockApi({ 'GET /pomodoros': () => page([session('p-1')]) });
    const result = await store.dispatch(pomodoroApi.endpoints.getPomodoros.initiate(1, { subscribe: false }));

    expect(result.data?.items[0]?.id).toBe('p-1');
    expect(new URL(api.requests[0]?.url ?? 'http://x').searchParams.get('page')).toBe('1');
    expect(api.requests[0]?.headers.get('X-Client-Time')).not.toBeNull();
  });

  it('RF-44 (001): una sesión fuera de contrato se trata como INTERNAL_ERROR', async () => {
    mockApi({ 'GET /pomodoros/p-1': () => apiOk({ ...session('p-1'), status: 'cancelled' }) });
    const result = await store.dispatch(pomodoroApi.endpoints.getPomodoro.initiate('p-1', { subscribe: false }));
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });

  it('RF-32: pide las tareas en espera de GET /pomodoro-tasks', async () => {
    mockApi({ 'GET /pomodoro-tasks': () => page([TASK]) });
    const result = await store.dispatch(pomodoroApi.endpoints.getWaitingTasks.initiate(1, { subscribe: false }));
    expect(result.data?.items).toEqual([TASK]);
  });
});

describe('pomodoroApi: mutaciones', () => {
  it('RF-14: empieza una sesión con el cuerpo de API-004 y vuelve a pedir la lista', async () => {
    const api = mockApi({
      'GET /pomodoros': () => page([]),
      'POST /pomodoros': () => apiOk(session('p-1'), 201),
    });
    const list = await subscribeList();
    const body = {
      durationMinutes: 45,
      newTasks: [{ title: 'Repasar', description: null, date: '2026-11-09' }],
      waitingTaskIds: ['t-9'],
    };

    await store.dispatch(pomodoroApi.endpoints.startPomodoro.initiate(body));
    await settle();

    expect(await api.bodyOf('POST /pomodoros')).toEqual(body);
    expect(count(api.requests, 'GET', '/pomodoros')).toBe(2);
    list.unsubscribe();
  });

  it.each(['paused', 'running', 'finished'] as const)(
    'RF-23 a RF-26: cambia el estado a %s con PATCH y guarda la sesión devuelta en su caché',
    async (status) => {
      const api = mockApi({ 'PATCH /pomodoros/p-1': () => apiOk(session('p-1', status)) });
      await store.dispatch(pomodoroApi.endpoints.changePomodoroStatus.initiate({ id: 'p-1', status }));
      await settle();

      expect(await api.bodyOf('PATCH /pomodoros/p-1')).toEqual({ status });
      expect(pomodoroApi.endpoints.getPomodoro.select('p-1')(store.getState()).data?.status).toBe(status);
    },
  );

  it('RF-28: terminar vuelve a pedir las tareas en espera; pausar no', async () => {
    const api = mockApi({
      'GET /pomodoro-tasks': () => page([]),
      'PATCH /pomodoros/p-1': async (request) => {
        const body: unknown = await request.json();
        const status = body !== null && typeof body === 'object' && 'status' in body ? body.status : 'running';
        return apiOk(session('p-1', status === 'finished' ? 'finished' : 'paused'));
      },
    });
    const waiting = store.dispatch(pomodoroApi.endpoints.getWaitingTasks.initiate(1));
    await waiting;

    await store.dispatch(pomodoroApi.endpoints.changePomodoroStatus.initiate({ id: 'p-1', status: 'paused' }));
    await settle();
    expect(count(api.requests, 'GET', '/pomodoro-tasks')).toBe(1);

    await store.dispatch(pomodoroApi.endpoints.changePomodoroStatus.initiate({ id: 'p-1', status: 'finished' }));
    await settle();
    expect(count(api.requests, 'GET', '/pomodoro-tasks')).toBe(2);
    waiting.unsubscribe();
  });

  it('RF-29 y RF-30: añade y quita tareas de la sesión y guarda la sesión devuelta', async () => {
    const api = mockApi({
      'POST /pomodoros/p-1/tasks': () => apiOk({ ...session('p-1'), totalTasks: 2 }),
      'DELETE /pomodoros/p-1/tasks/t-1': () => apiOk({ ...session('p-1'), tasks: [], totalTasks: 0 }),
    });
    const newTasks = [{ title: 'Llamar a Marta', description: null, date: '2026-11-09' }];

    await store.dispatch(pomodoroApi.endpoints.addPomodoroTasks.initiate({ id: 'p-1', newTasks, waitingTaskIds: [] }));
    await settle();
    expect(await api.bodyOf('POST /pomodoros/p-1/tasks')).toEqual({ newTasks, waitingTaskIds: [] });
    expect(pomodoroApi.endpoints.getPomodoro.select('p-1')(store.getState()).data?.totalTasks).toBe(2);

    await store.dispatch(pomodoroApi.endpoints.removePomodoroTask.initiate({ id: 'p-1', taskId: 't-1' }));
    await settle();
    expect(pomodoroApi.endpoints.getPomodoro.select('p-1')(store.getState()).data?.totalTasks).toBe(0);
  });

  it('RF-22 y RF-35: completa o edita una tarea con PATCH /pomodoro-tasks/{id} sin enviar la fecha', async () => {
    const api = mockApi({ 'PATCH /pomodoro-tasks/t-1': () => apiOk({ ...TASK, completed: true }) });
    await store.dispatch(
      pomodoroApi.endpoints.updatePomodoroTask.initiate({ id: 't-1', changes: { completed: true, title: 'Nuevo' } }),
    );
    expect(await api.bodyOf('PATCH /pomodoro-tasks/t-1')).toEqual({ completed: true, title: 'Nuevo' });
  });

  it('RF-33: borra una tarea en espera', async () => {
    const api = mockApi({ 'DELETE /pomodoro-tasks/t-1': () => apiOk(null) });
    const result = await store.dispatch(pomodoroApi.endpoints.deleteWaitingTask.initiate('t-1'));
    expect(result.error).toBeUndefined();
    expect(count(api.requests, 'DELETE', '/pomodoro-tasks/t-1')).toBe(1);
  });
});

describe('pomodoroApi: rechazos de estado (RF-46, RF-48)', () => {
  it.each(['INVALID_POMODORO_STATE', 'POMODORO_TASK_COMPLETED', 'POMODORO_ALREADY_ACTIVE'])(
    'con %s vuelve a pedir la lista de sesiones para mostrar el estado real',
    async (code) => {
      const api = mockApi({
        'GET /pomodoros': () => page([session('p-1')]),
        'POST /pomodoros': () => apiFail(409, code),
      });
      const list = await subscribeList();

      const result = await store.dispatch(
        pomodoroApi.endpoints.startPomodoro.initiate({ durationMinutes: 25, newTasks: [], waitingTaskIds: [] }),
      );
      await settle();

      expect(toApiError('error' in result ? result.error : undefined).code).toBe(code);
      expect(count(api.requests, 'GET', '/pomodoros')).toBe(2);
      list.unsubscribe();
    },
  );

  it('con un error de validación no vuelve a pedir nada ni toca la caché de la sesión', async () => {
    const api = mockApi({
      'GET /pomodoros': () => page([]),
      'PATCH /pomodoros/p-1': () => apiFail(400, 'VALIDATION_ERROR'),
    });
    const list = await subscribeList();

    await store.dispatch(pomodoroApi.endpoints.changePomodoroStatus.initiate({ id: 'p-1', status: 'paused' }));
    await settle();

    expect(count(api.requests, 'GET', '/pomodoros')).toBe(1);
    expect(pomodoroApi.endpoints.getPomodoro.select('p-1')(store.getState()).data).toBeUndefined();
    list.unsubscribe();
  });
});

const ACHIEVEMENT = {
  code: 'FIRST_POMODORO',
  name: 'Primer pomodoro',
  description: 'Termina tu primera sesión por tiempo',
  target: 1,
  progress: 0,
  unlocked: false,
  unlockedAt: null,
};

describe('pomodoroApi: racha y logros (Fase 2)', () => {
  it('RF-41: pide la racha del pomodoro a GET /pomodoro-streak con la forma de la racha del tablero', async () => {
    mockApi({ 'GET /pomodoro-streak': () => apiOk({ current: 2, best: 5 }) });
    const result = await store.dispatch(pomodoroApi.endpoints.getPomodoroStreak.initiate(undefined, { subscribe: false }));
    expect(result.data).toEqual({ current: 2, best: 5 });
  });

  it('RF-42: pide los logros a GET /pomodoro-achievements y valida cada uno', async () => {
    mockApi({ 'GET /pomodoro-achievements': () => apiOk([ACHIEVEMENT]) });
    const result = await store.dispatch(
      pomodoroApi.endpoints.getPomodoroAchievements.initiate('current', { subscribe: false }),
    );
    expect(result.data).toEqual([ACHIEVEMENT]);
  });

  it('RF-44 (001): un logro fuera de contrato se trata como INTERNAL_ERROR', async () => {
    mockApi({ 'GET /pomodoro-achievements': () => apiOk([{ ...ACHIEVEMENT, progress: -1 }]) });
    const result = await store.dispatch(
      pomodoroApi.endpoints.getPomodoroAchievements.initiate('current', { subscribe: false }),
    );
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });

  it('plan D-11: cada referencia es una entrada de caché distinta de la misma petición', async () => {
    const api = mockApi({ 'GET /pomodoro-achievements': () => apiOk([ACHIEVEMENT]) });
    const baseline = store.dispatch(pomodoroApi.endpoints.getPomodoroAchievements.initiate('baseline'));
    const atEnd = store.dispatch(pomodoroApi.endpoints.getPomodoroAchievements.initiate('p-1'));
    await baseline;
    await atEnd;

    expect(count(api.requests, 'GET', '/pomodoro-achievements')).toBe(2);
    baseline.unsubscribe();
    atEnd.unsubscribe();
  });

  it('RF-41: terminar una sesión vuelve a pedir la racha; pausarla no', async () => {
    const api = mockApi({
      'GET /pomodoro-streak': () => apiOk({ current: 0, best: 0 }),
      'PATCH /pomodoros/p-1': async (request) => {
        const body: unknown = await request.json();
        const finished = body !== null && typeof body === 'object' && 'status' in body && body.status === 'finished';
        return apiOk(session('p-1', finished ? 'finished' : 'paused'));
      },
    });
    const streak = store.dispatch(pomodoroApi.endpoints.getPomodoroStreak.initiate(undefined));
    await streak;

    await store.dispatch(pomodoroApi.endpoints.changePomodoroStatus.initiate({ id: 'p-1', status: 'paused' }));
    await settle();
    expect(count(api.requests, 'GET', '/pomodoro-streak')).toBe(1);

    await store.dispatch(pomodoroApi.endpoints.changePomodoroStatus.initiate({ id: 'p-1', status: 'finished' }));
    await settle();
    expect(count(api.requests, 'GET', '/pomodoro-streak')).toBe(2);
    streak.unsubscribe();
  });

  it('RF-45 y plan D-11: ni terminar ni completar una tarea vuelven a pedir la referencia de logros', async () => {
    const api = mockApi({
      'GET /pomodoro-achievements': () => apiOk([ACHIEVEMENT]),
      'PATCH /pomodoros/p-1': () => apiOk(session('p-1', 'finished')),
      'PATCH /pomodoro-tasks/t-1': () => apiOk({ ...TASK, completed: true, completedAt: '2026-11-09T09:10:00Z' }),
    });
    const baseline = store.dispatch(pomodoroApi.endpoints.getPomodoroAchievements.initiate('baseline'));
    await baseline;

    await store.dispatch(pomodoroApi.endpoints.updatePomodoroTask.initiate({ id: 't-1', changes: { completed: true } }));
    await store.dispatch(pomodoroApi.endpoints.changePomodoroStatus.initiate({ id: 'p-1', status: 'finished' }));
    await settle();

    expect(count(api.requests, 'GET', '/pomodoro-achievements')).toBe(1);
    baseline.unsubscribe();
  });
});
