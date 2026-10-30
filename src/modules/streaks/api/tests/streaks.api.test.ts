/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { toApiError } from '../../../../shared/api/api-error.util';
import { baseApi } from '../../../../shared/api/base.api';
import { createAppStore, type AppStore } from '../../../../shared/store/store';
import { streaksApi } from '../streaks.api';

let store: AppStore;

beforeEach(() => {
  store = createAppStore();
});

afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  jest.restoreAllMocks();
});

function fetchStreak() {
  return store.dispatch(streaksApi.endpoints.getStreak.initiate(undefined, { subscribe: false }));
}

describe('D-5: streaksApi.getStreak', () => {
  it('RF-25: devuelve la racha tal como la calcula la API', async () => {
    const api = mockApi({ 'GET /streak': () => apiOk({ current: 3, best: 5 }) });
    const result = await fetchStreak();
    expect(result.data).toEqual({ current: 3, best: 5 });
    expect(api.requests).toHaveLength(1);
  });

  it('envía la hora y la zona horaria del dispositivo (API-002 RF-30)', async () => {
    const api = mockApi({ 'GET /streak': () => apiOk({ current: 0, best: 0 }) });
    await fetchStreak();
    expect(api.requests[0]?.headers.get('X-Client-Time')).not.toBeNull();
    expect(api.requests[0]?.headers.get('X-Timezone')).not.toBeNull();
  });

  it('una respuesta fuera de contrato es un error interno (RF-44)', async () => {
    mockApi({ 'GET /streak': () => apiOk({ current: 'tres', best: 5 }) });
    const result = await fetchStreak();
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });

  it('propaga el error de la API con su código', async () => {
    mockApi({ 'GET /streak': () => apiFail(400, 'INVALID_TIMEZONE') });
    const result = await fetchStreak();
    expect(toApiError(result.error).code).toBe('INVALID_TIMEZONE');
  });

  it('D-7: invalidar Streak vuelve a pedir la racha', async () => {
    let current = 0;
    mockApi({ 'GET /streak': () => apiOk({ current, best: 2 }) });
    const subscription = store.dispatch(streaksApi.endpoints.getStreak.initiate(undefined));
    await subscription;
    current = 1;
    store.dispatch(baseApi.util.invalidateTags(['Streak']));
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    expect(streaksApi.endpoints.getStreak.select(undefined)(store.getState()).data).toEqual({ current: 1, best: 2 });
    subscription.unsubscribe();
  });
});
