import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '@test-utils/render-app';
import { useTaskDay } from '../use-task-day.hook';

const NOON = new Date(2026, 10, 8, 12, 0, 0);
const NEXT_DAY = new Date(2026, 10, 9, 0, 1, 0);

function task(id: string, date = '2026-11-08') {
  return {
    id,
    title: `Tarea ${id}`,
    description: null,
    date,
    completed: true,
    createdAt: '2026-11-08T09:15:00Z',
    updatedAt: '2026-11-08T09:15:00Z',
  };
}

function pageOf(items: unknown[], page: number, totalPages: number, totalItems = items.length) {
  return apiOk({ items, page, pageSize: 50, totalItems, totalPages });
}

function queryOf(request: Request | undefined): Record<string, string> {
  return request === undefined ? {} : Object.fromEntries(new URL(request.url).searchParams);
}

function setup(url = '/taskday') {
  return renderHook(() => ({ taskDay: useTaskDay(), router: useRouterProbe() }), {
    wrapper: appWrapper(freshStore(), url),
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOON, advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useTaskDay', () => {
  it('RF-01 y RF-03: pide las tareas completadas de hoy, página 1 de 50, y da el total', async () => {
    const api = mockApi({ 'GET /tasks': () => pageOf([task('a'), task('b')], 1, 1) });
    const { result } = setup();
    expect(result.current.taskDay.status).toBe('loading');
    await waitFor(() => {
      expect(result.current.taskDay.status).toBe('ready');
    });
    expect(queryOf(api.requests[0])).toEqual({
      status: 'completed',
      from: '2026-11-08',
      to: '2026-11-08',
      page: '1',
      pageSize: '50',
    });
    expect(result.current.taskDay.tasks.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.current.taskDay.totalItems).toBe(2);
  });

  it('RF-01: pide la página de la URL y cambia de página en la URL', async () => {
    const api = mockApi({
      'GET /tasks': (request) => pageOf([task('a')], Number(new URL(request.url).searchParams.get('page')), 3, 120),
    });
    const { result } = setup('/taskday?page=2');
    await waitFor(() => {
      expect(result.current.taskDay.status).toBe('ready');
    });
    expect(queryOf(api.requests[0]).page).toBe('2');
    expect(result.current.taskDay.page).toBe(2);
    expect(result.current.taskDay.totalPages).toBe(3);
    act(() => {
      result.current.taskDay.goToPage(3);
    });
    expect(result.current.router.location.search).toBe('?page=3');
  });

  it('S-02: una página fuera de rango se sustituye por la última', async () => {
    mockApi({
      'GET /tasks': (request) => pageOf([], Number(new URL(request.url).searchParams.get('page')), 2, 60),
    });
    const { result } = setup('/taskday?page=9');
    await waitFor(() => {
      expect(result.current.router.location.search).toBe('?page=2');
    });
    expect(result.current.router.navigationType).toBe('REPLACE');
  });

  it('RF-07: al cambiar el día pide las completadas del nuevo día sin mostrar las del anterior', async () => {
    const api = mockApi({
      'GET /tasks': (request) => {
        const day = new URL(request.url).searchParams.get('from') ?? '';
        return day === '2026-11-08' ? pageOf([task('a')], 1, 1) : pageOf([], 1, 0);
      },
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.taskDay.tasks).toHaveLength(1);
    });
    jest.setSystemTime(NEXT_DAY);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current.taskDay.tasks).toHaveLength(0);
    await waitFor(() => {
      expect(result.current.taskDay.status).toBe('ready');
    });
    expect(queryOf(api.requests.at(-1)).from).toBe('2026-11-09');
    expect(queryOf(api.requests.at(-1)).to).toBe('2026-11-09');
  });

  it('001 RF-44: si la consulta falla da el mensaje y reintenta', async () => {
    let fails = true;
    mockApi({ 'GET /tasks': () => (fails ? apiFail(500, 'INTERNAL_ERROR') : pageOf([task('a')], 1, 1)) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.taskDay.status).toBe('error');
    });
    expect(result.current.taskDay.errorMessage).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    fails = false;
    act(() => {
      result.current.taskDay.retry();
    });
    await waitFor(() => {
      expect(result.current.taskDay.status).toBe('ready');
    });
    expect(result.current.taskDay.errorMessage).toBeUndefined();
  });
});
