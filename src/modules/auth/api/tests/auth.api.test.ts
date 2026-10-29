/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { createAppStore } from '../../../../shared/store/store';
import { sessionStarted } from '../../store/auth.slice';
import { authApi } from '../auth.api';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function stubFetch(response: () => Response) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(response()));
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RF-08: authApi.me', () => {
  it('200 → sesión abierta con el usuario y el token CSRF de la sesión (D-1)', async () => {
    const fetchSpy = stubFetch(() =>
      json(200, { success: true, status: 200, message: 'ok', data: { user: USER, csrfToken: 'csrf-1' } }),
    );
    const store = createAppStore();
    await store.dispatch(authApi.endpoints.me.initiate(undefined));

    const request = fetchSpy.mock.calls[0]?.[0] as Request;
    expect(request.url).toBe('http://localhost:3000/me');
    expect(request.credentials).toBe('include');
    expect(store.getState().auth).toEqual({ status: 'authenticated', user: USER, csrfToken: 'csrf-1', expired: false });
  });

  it('401 → sin sesión, sin marcarla como caducada', async () => {
    stubFetch(() => json(401, { success: false, status: 401, error: { code: 'MISSING_TOKEN', message: 'x' } }));
    const store = createAppStore();
    await store.dispatch(authApi.endpoints.me.initiate(undefined));
    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().auth.expired).toBe(false);
  });

  it('D-5: una respuesta fuera de contrato (sin csrfToken) no abre la sesión', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch(() => json(200, { success: true, status: 200, message: 'ok', data: USER }));
    const store = createAppStore();
    await store.dispatch(authApi.endpoints.me.initiate(undefined));
    expect(store.getState().auth.status).toBe('anonymous');
  });

  it('un fallo de /me con la sesión ya abierta no la cierra', async () => {
    stubFetch(() => json(500, { success: false, status: 500, error: { code: 'INTERNAL_ERROR', message: 'x' } }));
    const store = createAppStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'csrf-1' }));
    await store.dispatch(authApi.endpoints.me.initiate(undefined));
    expect(store.getState().auth.status).toBe('authenticated');
  });
});
