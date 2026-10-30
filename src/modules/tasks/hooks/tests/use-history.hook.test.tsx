import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '../../../../../jest/render-app';
import { useHistory } from '../use-history.hook';

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

function pageOf(items: unknown[], page: number, totalPages: number, totalItems = items.length) {
  return apiOk({ items, page, pageSize: 50, totalItems, totalPages });
}

function queryOf(request: Request | undefined): Record<string, string> {
  return request === undefined ? {} : Object.fromEntries(new URL(request.url).searchParams);
}

function setup(url = '/history') {
  // Leer los errores al renderizar los suscribe, como hace HistoryFilters (React Hook Form usa un proxy)
  return renderHook(
    () => {
      const history = useHistory();
      return { history, errors: history.form.formState.errors, router: useRouterProbe() };
    },
    {
      wrapper: appWrapper(freshStore(), url),
    },
  );
}

type View = ReturnType<typeof setup>['result'];

async function ready(result: View) {
  await waitFor(() => {
    expect(result.current.history.status).toBe('ready');
  });
}

async function applyFilters(result: View, values: { status?: string; from?: string; to?: string }) {
  act(() => {
    if (values.status !== undefined)
      result.current.history.form.setValue('status', values.status === 'pending' ? 'pending' : 'completed');
    if (values.from !== undefined) result.current.history.form.setValue('from', values.from);
    if (values.to !== undefined) result.current.history.form.setValue('to', values.to);
  });
  await act(async () => {
    result.current.history.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useHistory', () => {
  it('RF-31 y RF-34: sin filtros pide todas las tareas, página 1 de 50, y da los totales', async () => {
    const api = mockApi({
      'GET /tasks': () => pageOf([task('a', '2026-10-28'), task('b', '2026-10-29', true)], 1, 3, 120),
    });
    const { result } = setup();
    await ready(result);
    expect(queryOf(api.requests[0])).toEqual({ status: 'all', page: '1', pageSize: '50' });
    expect(result.current.history.tasks.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.current.history.page).toBe(1);
    expect(result.current.history.totalPages).toBe(3);
    expect(result.current.history.totalItems).toBe(120);
    expect(result.current.history.isFiltered).toBe(false);
  });

  it('D-8: lee los filtros y la página de la URL y los pone en el formulario', async () => {
    const api = mockApi({ 'GET /tasks': () => pageOf([], 2, 3, 120) });
    const { result } = setup('/history?status=pending&from=2026-10-01&to=2026-10-31&page=2');
    await ready(result);
    expect(queryOf(api.requests[0])).toEqual({
      status: 'pending',
      from: '2026-10-01',
      to: '2026-10-31',
      page: '2',
      pageSize: '50',
    });
    expect(result.current.history.form.getValues()).toEqual({
      status: 'pending',
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(result.current.history.isFiltered).toBe(true);
  });

  it('D-8: unos filtros de la URL no válidos se ignoran', async () => {
    const api = mockApi({ 'GET /tasks': () => pageOf([], 1, 0) });
    const { result } = setup('/history?status=raro&from=2026-10-31&to=2026-10-01&page=-3');
    await ready(result);
    expect(queryOf(api.requests[0])).toEqual({ status: 'all', page: '1', pageSize: '50' });
  });

  it('RF-32 y D-8: aplicar filtros válidos los lleva a la URL y vuelve a la primera página', async () => {
    mockApi({ 'GET /tasks': () => pageOf([], 1, 0) });
    const { result } = setup('/history?page=3');
    await applyFilters(result, { status: 'completed', from: '2026-10-01', to: '2026-10-01' });
    await waitFor(() => {
      expect(result.current.router.location.search).toBe('?status=completed&from=2026-10-01&to=2026-10-01');
    });
    expect(result.current.history.page).toBe(1);
  });

  it('RF-33: «desde» posterior a «hasta» muestra el error y no aplica el filtro', async () => {
    mockApi({ 'GET /tasks': () => pageOf([], 1, 0) });
    const { result } = setup();
    await applyFilters(result, { from: '2026-10-31', to: '2026-10-01' });
    await waitFor(() => {
      expect(result.current.errors.from?.message).toBe('«Desde» no puede ser posterior a «Hasta».');
    });
    expect(result.current.router.location.search).toBe('');
  });

  it('quitar los filtros deja la URL limpia y el formulario vacío', async () => {
    mockApi({ 'GET /tasks': () => pageOf([], 1, 0) });
    const { result } = setup('/history?status=pending&from=2026-10-01');
    await ready(result);
    act(() => {
      result.current.history.clearFilters();
    });
    await waitFor(() => {
      expect(result.current.history.form.getValues()).toEqual({ status: 'all', from: '', to: '' });
    });
    expect(result.current.router.location.search).toBe('');
  });

  it('RF-34: cambiar de página conserva los filtros', async () => {
    mockApi({ 'GET /tasks': () => pageOf([], 1, 3, 120) });
    const { result } = setup('/history?status=pending');
    await ready(result);
    act(() => {
      result.current.history.goToPage(2);
    });
    expect(result.current.router.location.search).toBe('?status=pending&page=2');
  });

  it('plan §5.6: una página fuera de rango se sustituye por la última', async () => {
    mockApi({
      'GET /tasks': (request) => {
        const requested = Number(new URL(request.url).searchParams.get('page'));
        return pageOf([], requested, 2, 60);
      },
    });
    const { result } = setup('/history?status=pending&page=9');
    await waitFor(() => {
      expect(result.current.router.location.search).toBe('?status=pending&page=2');
    });
    expect(result.current.router.navigationType).toBe('REPLACE');
  });

  it('RF-44: si la consulta falla da el mensaje y reintenta', async () => {
    let fails = true;
    mockApi({ 'GET /tasks': () => (fails ? apiFail(500, 'INTERNAL_ERROR') : pageOf([task('a', '2026-10-29')], 1, 1)) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.history.status).toBe('error');
    });
    expect(result.current.history.errorMessage).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    fails = false;
    act(() => {
      result.current.history.retry();
    });
    await ready(result);
    expect(result.current.history.tasks).toHaveLength(1);
  });
});
