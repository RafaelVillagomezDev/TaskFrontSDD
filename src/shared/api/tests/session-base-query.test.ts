/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';

import { createSessionBaseQuery } from '../session-base-query';

interface FakeState {
  auth: { status: 'unknown' | 'authenticated' | 'anonymous'; csrfToken: string | null };
}

const NOW = new Date(2026, 9, 29, 20, 0, 0);

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

const ok = (data: unknown = null) => json(200, { success: true, status: 200, message: 'ok', data });
const apiError = (status: number, code: string) =>
  json(status, { success: false, status, error: { code, message: 'x' } });

function setup(state: FakeState, responder: (request: Request) => Response | Promise<Response>) {
  const requests: Request[] = [];
  const fetchFn = jest.fn((input: RequestInfo | URL) => {
    const request = input as Request;
    requests.push(request);
    return Promise.resolve(responder(request));
  });
  const dispatch = jest.fn();
  const api = {
    getState: () => state,
    dispatch,
    signal: new AbortController().signal,
    abort: jest.fn(),
    endpoint: 'test',
    type: 'query',
    extra: undefined,
  } as unknown as BaseQueryApi;
  const baseQuery = createSessionBaseQuery({
    baseUrl: 'http://api.test',
    fetchFn,
    now: () => NOW,
  });
  return { baseQuery, api, requests, dispatch, fetchFn };
}

const authenticated: FakeState = { auth: { status: 'authenticated', csrfToken: 'csrf-1' } };

describe('cabeceras', () => {
  it('envía las cookies en todas las peticiones', async () => {
    const { baseQuery, api, requests } = setup(authenticated, () => ok());
    await baseQuery('/me', api, {});
    expect(requests[0]?.credentials).toBe('include');
  });

  it.each(['POST', 'PATCH', 'DELETE'])('añade X-CSRF-Token en %s', async (method) => {
    const { baseQuery, api, requests } = setup(authenticated, () => ok());
    await baseQuery({ url: '/tasks/1', method }, api, {});
    expect(requests[0]?.headers.get('X-CSRF-Token')).toBe('csrf-1');
  });

  it('no añade X-CSRF-Token en GET', async () => {
    const { baseQuery, api, requests } = setup(authenticated, () => ok());
    await baseQuery('/me', api, {});
    expect(requests[0]?.headers.has('X-CSRF-Token')).toBe(false);
  });

  it('respeta un X-CSRF-Token explícito (token previo a la sesión del login)', async () => {
    const { baseQuery, api, requests } = setup({ auth: { status: 'anonymous', csrfToken: null } }, () => ok());
    await baseQuery({ url: '/auth/login', method: 'POST', headers: { 'X-CSRF-Token': 'pre' } }, api, {});
    expect(requests[0]?.headers.get('X-CSRF-Token')).toBe('pre');
  });

  it.each(['/tasks', '/tasks/1', '/tasks?date=2026-10-29', '/streak', '/alerts?page=2'])(
    'añade la hora y la zona del dispositivo en %s',
    async (url) => {
      const { baseQuery, api, requests } = setup(authenticated, () => ok());
      await baseQuery(url, api, {});
      expect(requests[0]?.headers.get('X-Client-Time')).toBe('2026-10-29T20:00:00-07:00');
      expect(requests[0]?.headers.get('X-Timezone')).toBe('America/Los_Angeles');
    },
  );

  it.each(['/me', '/auth/csrf', '/tasksx'])('no añade la hora en %s', async (url) => {
    const { baseQuery, api, requests } = setup(authenticated, () => ok());
    await baseQuery(url, api, {});
    expect(requests[0]?.headers.has('X-Client-Time')).toBe(false);
  });
});

describe('RF-06: renovación de la sesión', () => {
  it('ante TOKEN_EXPIRED renueva la sesión y repite la petición', async () => {
    let expired = true;
    const { baseQuery, api, requests } = setup(authenticated, (request) => {
      if (request.url.endsWith('/auth/refresh')) {
        expired = false;
        return ok();
      }
      return expired ? apiError(401, 'TOKEN_EXPIRED') : ok({ id: 'u1' });
    });
    const result = await baseQuery('/me', api, {});
    expect(result.data).toEqual({ success: true, status: 200, message: 'ok', data: { id: 'u1' } });
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual(['/me', '/auth/refresh', '/me']);
    expect(requests[1]?.headers.get('X-CSRF-Token')).toBe('csrf-1');
  });

  it('con 3 peticiones simultáneas caducadas hace una sola renovación y 3 reintentos', async () => {
    let expired = true;
    const { baseQuery, api, requests } = setup(authenticated, async (request) => {
      if (request.url.endsWith('/auth/refresh')) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        expired = false;
        return ok();
      }
      return expired ? apiError(401, 'TOKEN_EXPIRED') : ok();
    });
    await Promise.all([baseQuery('/me', api, {}), baseQuery('/streak', api, {}), baseQuery('/alerts', api, {})]);
    const paths = requests.map((r) => new URL(r.url).pathname);
    expect(paths.filter((p) => p === '/auth/refresh')).toHaveLength(1);
    expect(paths.filter((p) => p !== '/auth/refresh')).toHaveLength(6);
  });
});

describe('RF-07: fin de la sesión', () => {
  it.each([
    ['SESSION_EXPIRED', 'en la renovación'],
    ['INVALID_REFRESH_TOKEN', 'en la renovación'],
  ])('si la renovación responde %s, la sesión caduca y no se reintenta', async (code) => {
    const { baseQuery, api, requests, dispatch } = setup(authenticated, (request) =>
      request.url.endsWith('/auth/refresh') ? apiError(401, code) : apiError(401, 'TOKEN_EXPIRED'),
    );
    const result = await baseQuery('/me', api, {});
    expect(result.error?.status).toBe(401);
    expect(requests).toHaveLength(2);
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/sessionExpired', payload: undefined });
  });

  it.each(['INVALID_TOKEN', 'MISSING_TOKEN'])('con %s y una sesión abierta, la sesión caduca', async (code) => {
    const { baseQuery, api, dispatch } = setup(authenticated, () => apiError(401, code));
    await baseQuery('/tasks', api, {});
    expect(dispatch).toHaveBeenCalledWith({ type: 'auth/sessionExpired', payload: undefined });
  });

  it('al arrancar sin sesión (MISSING_TOKEN en /me) no la marca como caducada', async () => {
    const { baseQuery, api, dispatch } = setup({ auth: { status: 'unknown', csrfToken: null } }, () =>
      apiError(401, 'MISSING_TOKEN'),
    );
    await baseQuery('/me', api, {});
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('un login fallido (INVALID_CREDENTIALS) no toca la sesión ni renueva', async () => {
    const { baseQuery, api, dispatch, requests } = setup({ auth: { status: 'anonymous', csrfToken: null } }, () =>
      apiError(401, 'INVALID_CREDENTIALS'),
    );
    await baseQuery({ url: '/auth/login', method: 'POST' }, api, {});
    expect(dispatch).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
  });
});
