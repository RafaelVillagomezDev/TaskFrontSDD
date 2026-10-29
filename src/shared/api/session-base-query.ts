import {
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';
import { z } from 'zod';

import { sessionExpired } from '../../modules/auth';
import { toApiError, type ApiErrorCode } from './api-error.util';
import { buildClientTimeHeaders } from './client-time.util';

// Rutas que exigen la hora y la zona del dispositivo (API-002 RF-30)
const CLIENT_TIME_PATHS = ['/tasks', '/streak', '/alerts'];
// Métodos que exigen X-CSRF-Token (API-002 RF-23)
const CSRF_METHODS = new Set(['POST', 'PATCH', 'DELETE']);
// Errores que significan que la sesión ya no existe y no se puede renovar
const SESSION_ENDING_CODES: readonly ApiErrorCode[] = [
  'MISSING_TOKEN',
  'INVALID_TOKEN',
  'SESSION_EXPIRED',
  'INVALID_REFRESH_TOKEN',
];

// El estado llega como unknown: se valida en lugar de afirmar su tipo (CONSTITUTION.md IV.2)
const sessionStateSchema = z.object({
  auth: z.object({ status: z.string(), csrfToken: z.string().nullable() }),
});

function readSession(getState: () => unknown): { status: string; csrfToken: string | null } {
  const parsed = sessionStateSchema.safeParse(getState());
  return parsed.success ? parsed.data.auth : { status: 'unknown', csrfToken: null };
}

function requestInfo(arg: string | FetchArgs): { path: string; method: string } {
  if (typeof arg === 'string') return { path: arg, method: 'GET' };
  return { path: arg.url, method: (arg.method ?? 'GET').toUpperCase() };
}

function needsClientTime(path: string): boolean {
  return CLIENT_TIME_PATHS.some((base) => path === base || path.startsWith(`${base}/`) || path.startsWith(`${base}?`));
}

interface SessionBaseQueryOptions {
  baseUrl: string;
  fetchFn?: typeof fetch;
  now?: () => Date;
}

export type SessionBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>;

// Consulta base de toda la app (plan §5.2): cookies, CSRF, hora del dispositivo y renovación de la sesión
export function createSessionBaseQuery({
  baseUrl,
  fetchFn,
  now = () => new Date(),
}: SessionBaseQueryOptions): SessionBaseQuery {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    ...(fetchFn === undefined ? {} : { fetchFn }),
    prepareHeaders: (headers, { getState, arg }) => {
      const { path, method } = requestInfo(arg);
      const { csrfToken } = readSession(getState);
      // El login y el registro envían su propio token previo a la sesión
      if (CSRF_METHODS.has(method) && csrfToken !== null && !headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', csrfToken);
      }
      if (needsClientTime(path)) {
        const timeHeaders = buildClientTimeHeaders(now());
        headers.set('X-Client-Time', timeHeaders['X-Client-Time']);
        headers.set('X-Timezone', timeHeaders['X-Timezone']);
      }
      return headers;
    },
  });

  // Cerrojo de renovación (plan D-6): las peticiones que caducan a la vez esperan a la misma renovación
  let refreshing: Promise<boolean> | null = null;

  function refreshSession(api: BaseQueryApi, extraOptions: object): Promise<boolean> {
    if (refreshing !== null) return refreshing;
    const pending = Promise.resolve(rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions))
      .then((result) => result.error === undefined)
      .finally(() => {
        refreshing = null;
      });
    refreshing = pending;
    return pending;
  }

  // Solo caduca una sesión que estaba abierta: al arrancar sin sesión, un 401 de /me no es una sesión caducada
  function expireSession(api: BaseQueryApi): void {
    if (readSession(api.getState).status === 'authenticated') api.dispatch(sessionExpired());
  }

  return async (args, api, extraOptions: object) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error === undefined) return result;

    const { code } = toApiError(result.error);
    if (code === 'TOKEN_EXPIRED') {
      if (await refreshSession(api, extraOptions)) return rawBaseQuery(args, api, extraOptions);
      expireSession(api);
      return result;
    }
    if (SESSION_ENDING_CODES.includes(code)) expireSession(api);
    return result;
  };
}
