import { jest } from '@jest/globals';

import { apiOk, mockApi } from '@test-utils/mock-api';
import { sessionEnded, sessionStarted } from '@modules/auth';
import { streaksApi } from '@modules/streaks';
import { sessionExpired } from '@shared/api/session.actions';
import { createAppStore, type AppStore } from '../store';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

// Store real con datos de la cuenta en la caché de RTK Query
async function storeWithCachedData(): Promise<AppStore> {
  mockApi({ 'GET /streak': () => apiOk({ current: 3, best: 7 }) });
  const store = createAppStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  await store.dispatch(streaksApi.endpoints.getStreak.initiate(undefined));
  expect(Object.keys(store.getState().api.queries)).not.toHaveLength(0);
  return store;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('session-cleanup listener', () => {
  it('RF-01: cuando la sesión caduca, borra de la memoria los datos de la cuenta', async () => {
    const store = await storeWithCachedData();
    store.dispatch(sessionExpired());
    expect(store.getState().api.queries).toEqual({});
  });

  it('RF-01 y RF-02: al cerrar sesión también los borra, para que la siguiente cuenta no los vea', async () => {
    const store = await storeWithCachedData();
    store.dispatch(sessionEnded());
    expect(store.getState().api.queries).toEqual({});
  });

  it('otras acciones no tocan la caché', async () => {
    const store = await storeWithCachedData();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-2' }));
    expect(Object.keys(store.getState().api.queries)).not.toHaveLength(0);
  });
});
