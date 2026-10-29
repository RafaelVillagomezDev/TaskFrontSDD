/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { toApiError } from '../../../../shared/api/api-error.util';
import { createAppStore } from '../../../../shared/store/store';
import { sessionStarted } from '../../store/auth.slice';
import { authApi } from '../auth.api';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const CREDENTIALS = { email: 'ana@example.com', password: 'correct horse battery' };
const csrf = () => apiOk({ csrfToken: 'previo-1' });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('D-5: authApi.login', () => {
  it('RF-04: pide antes GET /auth/csrf y envía su token con las credenciales', async () => {
    const api = mockApi({
      'GET /auth/csrf': csrf,
      'POST /auth/login': () => apiOk({ user: USER, csrfToken: 'sesion-1' }),
    });
    const store = createAppStore();
    const result = await store.dispatch(authApi.endpoints.login.initiate(CREDENTIALS));

    expect(result.data).toEqual({ user: USER, csrfToken: 'sesion-1' });
    expect(api.requests.map((request) => `${request.method} ${new URL(request.url).pathname}`)).toEqual([
      'GET /auth/csrf',
      'POST /auth/login',
    ]);
    expect(api.requests[1]?.headers.get('X-CSRF-Token')).toBe('previo-1');
    expect(api.requests[1]?.credentials).toBe('include');
    expect(await api.bodyOf('POST /auth/login')).toEqual(CREDENTIALS);
  });

  it('con éxito abre la sesión con el usuario y el token CSRF de la sesión (RNF-06: solo en memoria)', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiOk({ user: USER, csrfToken: 'sesion-1' }) });
    const store = createAppStore();
    await store.dispatch(authApi.endpoints.login.initiate(CREDENTIALS));
    expect(store.getState().auth).toEqual({
      status: 'authenticated',
      user: USER,
      csrfToken: 'sesion-1',
      expired: false,
      signedOut: false,
    });
  });

  it('RF-04: INVALID_CREDENTIALS llega como error y no abre la sesión', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(401, 'INVALID_CREDENTIALS') });
    const store = createAppStore();
    const result = await store.dispatch(authApi.endpoints.login.initiate(CREDENTIALS));
    expect(toApiError(result.error).code).toBe('INVALID_CREDENTIALS');
    expect(store.getState().auth.status).toBe('unknown');
  });

  it('si falla GET /auth/csrf no intenta el inicio de sesión', async () => {
    const api = mockApi({ 'GET /auth/csrf': () => apiFail(500, 'INTERNAL_ERROR') });
    const store = createAppStore();
    const result = await store.dispatch(authApi.endpoints.login.initiate(CREDENTIALS));
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
    expect(api.requests).toHaveLength(1);
  });

  it('RF-44: una respuesta fuera de contrato es INTERNAL_ERROR', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiOk({ user: USER }) });
    const store = createAppStore();
    const result = await store.dispatch(authApi.endpoints.login.initiate(CREDENTIALS));
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
    expect(store.getState().auth.status).toBe('unknown');
  });

  it('un token CSRF previo fuera de contrato es INTERNAL_ERROR', async () => {
    mockApi({ 'GET /auth/csrf': () => apiOk({}) });
    const store = createAppStore();
    const result = await store.dispatch(authApi.endpoints.login.initiate(CREDENTIALS));
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });
});

describe('D-5: authApi.register', () => {
  it('RF-01: pide el token previo, envía email, contraseña y nombre, y valida el usuario creado', async () => {
    const api = mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiOk(USER, 201) });
    const store = createAppStore();
    const values = { ...CREDENTIALS, name: 'Ana' };
    const result = await store.dispatch(authApi.endpoints.register.initiate(values));
    expect(result.data).toEqual(USER);
    expect(api.requests[1]?.headers.get('X-CSRF-Token')).toBe('previo-1');
    expect(await api.bodyOf('POST /auth/register')).toEqual(values);
    // No abre sesión (API-002 RF-06)
    expect(store.getState().auth.status).toBe('unknown');
  });

  it('RF-03: EMAIL_ALREADY_REGISTERED llega como error', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(409, 'EMAIL_ALREADY_REGISTERED') });
    const store = createAppStore();
    const result = await store.dispatch(authApi.endpoints.register.initiate(CREDENTIALS));
    expect(toApiError(result.error).code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('RF-44: un usuario fuera de contrato es INTERNAL_ERROR', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiOk({ id: 'u1' }, 201) });
    const store = createAppStore();
    const result = await store.dispatch(authApi.endpoints.register.initiate(CREDENTIALS));
    expect(toApiError(result.error).code).toBe('INTERNAL_ERROR');
  });
});

describe('authApi.logout', () => {
  it('envía POST /auth/logout con el token CSRF de la sesión', async () => {
    const api = mockApi({ 'POST /auth/logout': () => apiOk(null) });
    const store = createAppStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
    const result = await store.dispatch(authApi.endpoints.logout.initiate(undefined));
    expect(result.error).toBeUndefined();
    expect(api.requests[0]?.headers.get('X-CSRF-Token')).toBe('sesion-1');
  });
});

describe('RF-08: authApi.me', () => {
  it('200 → sesión abierta con el usuario y el token CSRF de la sesión (D-1)', async () => {
    const api = mockApi({ 'GET /me': () => apiOk({ user: USER, csrfToken: 'csrf-1' }) });
    const store = createAppStore();
    await store.dispatch(authApi.endpoints.me.initiate(undefined));

    expect(api.requests[0]?.url).toBe('http://localhost:3000/me');
    expect(api.requests[0]?.credentials).toBe('include');
    expect(store.getState().auth).toEqual({
      status: 'authenticated',
      user: USER,
      csrfToken: 'csrf-1',
      expired: false,
      signedOut: false,
    });
  });

  it('401 → sin sesión, sin marcarla como caducada', async () => {
    mockApi({ 'GET /me': () => apiFail(401, 'MISSING_TOKEN') });
    const store = createAppStore();
    await store.dispatch(authApi.endpoints.me.initiate(undefined));
    expect(store.getState().auth.status).toBe('anonymous');
    expect(store.getState().auth.expired).toBe(false);
  });

  it('D-5: una respuesta fuera de contrato (sin csrfToken) no abre la sesión', async () => {
    mockApi({ 'GET /me': () => apiOk(USER) });
    const store = createAppStore();
    await store.dispatch(authApi.endpoints.me.initiate(undefined));
    expect(store.getState().auth.status).toBe('anonymous');
  });

  it('un fallo de /me con la sesión ya abierta no la cierra', async () => {
    mockApi({ 'GET /me': () => apiFail(500, 'INTERNAL_ERROR') });
    const store = createAppStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'csrf-1' }));
    await store.dispatch(authApi.endpoints.me.initiate(undefined));
    expect(store.getState().auth.status).toBe('authenticated');
  });
});
