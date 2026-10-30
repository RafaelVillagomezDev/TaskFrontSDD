import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '../../../../../jest/render-app';
import { useAlertsPage } from '../use-alerts-page.hook';

const ALERT = {
  id: 'al1',
  type: 'daily',
  periodStart: '2026-10-29',
  periodEnd: '2026-10-29',
  tasks: [],
  createdAt: '2026-10-29T22:00:00Z',
};

function pageOf(page: number, totalPages: number, totalItems: number) {
  return apiOk({ items: [ALERT], page, pageSize: 50, totalItems, totalPages });
}

function setup(url = '/alerts') {
  return renderHook(() => ({ alerts: useAlertsPage(), router: useRouterProbe() }), {
    wrapper: appWrapper(freshStore(), url),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useAlertsPage', () => {
  it('RF-35: pide la página de la URL y da los avisos con sus totales', async () => {
    const api = mockApi({ 'GET /alerts': () => pageOf(2, 3, 120) });
    const { result } = setup('/alerts?page=2');
    await waitFor(() => {
      expect(result.current.alerts.status).toBe('ready');
    });
    expect(new URL(api.requests[0]?.url ?? 'http://x').searchParams.get('page')).toBe('2');
    expect(result.current.alerts.alerts).toEqual([ALERT]);
    expect(result.current.alerts.page).toBe(2);
    expect(result.current.alerts.totalPages).toBe(3);
    expect(result.current.alerts.totalItems).toBe(120);
  });

  it('RF-35: cambiar de página lo lleva a la URL; la primera no se escribe', async () => {
    mockApi({ 'GET /alerts': () => pageOf(1, 3, 120) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.alerts.status).toBe('ready');
    });
    act(() => {
      result.current.alerts.goToPage(3);
    });
    expect(result.current.router.location.search).toBe('?page=3');
    act(() => {
      result.current.alerts.goToPage(1);
    });
    expect(result.current.router.location.search).toBe('');
  });

  it('una página fuera de rango se sustituye por la última', async () => {
    mockApi({ 'GET /alerts': (request) => pageOf(Number(new URL(request.url).searchParams.get('page')), 2, 60) });
    const { result } = setup('/alerts?page=5');
    await waitFor(() => {
      expect(result.current.router.location.search).toBe('?page=2');
    });
    expect(result.current.router.navigationType).toBe('REPLACE');
  });

  it('RF-44: si falla da el mensaje y reintenta', async () => {
    let fails = true;
    mockApi({ 'GET /alerts': () => (fails ? apiFail(500, 'INTERNAL_ERROR') : pageOf(1, 1, 1)) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.alerts.status).toBe('error');
    });
    expect(result.current.alerts.errorMessage).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    fails = false;
    act(() => {
      result.current.alerts.retry();
    });
    await waitFor(() => {
      expect(result.current.alerts.status).toBe('ready');
    });
  });
});
