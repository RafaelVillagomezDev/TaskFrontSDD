/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { toApiError } from '../../../../shared/api/api-error.util';
import { baseApi } from '../../../../shared/api/base.api';
import { createAppStore, type AppStore } from '../../../../shared/store/store';
import { alertsApi } from '../alerts.api';

const ALERT = {
  id: 'al1',
  type: 'daily',
  periodStart: '2026-10-29',
  periodEnd: '2026-10-29',
  tasks: [{ id: 't1', title: 'Llamar al banco', date: '2026-10-29' }],
  createdAt: '2026-10-29T22:00:00Z',
};

function pageOf(items: unknown[], page = 1, pageSize = 50) {
  return apiOk({ items, page, pageSize, totalItems: items.length, totalPages: items.length === 0 ? 0 : 1 });
}

function queryOf(request: Request | undefined): Record<string, string> {
  return request === undefined ? {} : Object.fromEntries(new URL(request.url).searchParams);
}

let store: AppStore;

beforeEach(() => {
  store = createAppStore();
});

afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  jest.restoreAllMocks();
});

describe('D-5: alertsApi.getAlerts', () => {
  it('RF-35: pide la página indicada con pageSize=50 y la hora del dispositivo', async () => {
    const api = mockApi({ 'GET /alerts': () => pageOf([ALERT], 2) });
    const result = await store.dispatch(alertsApi.endpoints.getAlerts.initiate(2, { subscribe: false }));
    expect(result.data?.items).toEqual([ALERT]);
    expect(queryOf(api.requests[0])).toEqual({ page: '2', pageSize: '50' });
    expect(api.requests[0]?.headers.get('X-Client-Time')).not.toBeNull();
    expect(api.requests[0]?.headers.get('X-Timezone')).not.toBeNull();
  });

  it('RF-44: una respuesta fuera de contrato es INTERNAL_ERROR', async () => {
    mockApi({ 'GET /alerts': () => pageOf([{ ...ALERT, type: 'yearly' }]) });
    const result = await store.dispatch(alertsApi.endpoints.getAlerts.initiate(1, { subscribe: false }));
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });
});

describe('D-5: alertsApi.getLatestAlert', () => {
  it('RF-37: pide un solo aviso (pageSize=1) y lo devuelve', async () => {
    const api = mockApi({ 'GET /alerts': () => pageOf([ALERT], 1, 1) });
    const result = await store.dispatch(alertsApi.endpoints.getLatestAlert.initiate(undefined, { subscribe: false }));
    expect(result.data).toEqual(ALERT);
    expect(queryOf(api.requests[0])).toEqual({ page: '1', pageSize: '1' });
  });

  it('RF-37: sin avisos devuelve null', async () => {
    mockApi({ 'GET /alerts': () => pageOf([], 1, 1) });
    const result = await store.dispatch(alertsApi.endpoints.getLatestAlert.initiate(undefined, { subscribe: false }));
    expect(result.data).toBeNull();
  });

  it('propaga el error de la API con su código', async () => {
    mockApi({ 'GET /alerts': () => apiFail(400, 'INVALID_TIMEZONE') });
    const result = await store.dispatch(alertsApi.endpoints.getLatestAlert.initiate(undefined, { subscribe: false }));
    expect(toApiError(result.error).code).toBe('INVALID_TIMEZONE');
  });
});
