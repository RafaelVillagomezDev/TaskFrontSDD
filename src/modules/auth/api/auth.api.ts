import type { FetchArgs } from '@reduxjs/toolkit/query';
import { z } from 'zod';

import { baseApi } from '../../../shared/api/base.api';
import { validatedResult, type ApiResult, type BoundBaseQuery } from '../../../shared/api/validated-result.util';
import type { LoginValues } from '../schemas/login.schema';
import type { RegisterValues } from '../schemas/register.schema';
import { sessionSchema, userSchema, type Session, type User } from '../schemas/user.schema';
import { sessionCheckFailed, sessionStarted } from '../store/auth.slice';

const csrfSchema = z.object({ csrfToken: z.string() });

// Registro e inicio de sesión llevan el token CSRF previo a la sesión: se pide justo antes (API-002 RF-22, RF-23)
async function withPreSessionCsrf<T>(
  baseQuery: BoundBaseQuery,
  request: FetchArgs,
  dataSchema: z.ZodType<T>,
): Promise<ApiResult<T>> {
  const csrf = validatedResult(await baseQuery('/auth/csrf'), csrfSchema);
  if (csrf.error !== undefined) return csrf;
  const headers = { 'X-CSRF-Token': csrf.data.csrfToken };
  return validatedResult(await baseQuery({ ...request, method: 'POST', headers }), dataSchema);
}

// Endpoints de auth sobre la API base única (plan D-2); cada respuesta se valida con Zod (D-5)
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<User, RegisterValues>({
      queryFn: (body, _api, _extra, baseQuery) =>
        withPreSessionCsrf(baseQuery, { url: '/auth/register', body }, userSchema),
    }),
    login: build.mutation<Session, LoginValues>({
      queryFn: async (body, { dispatch }, _extra, baseQuery) => {
        const result = await withPreSessionCsrf(baseQuery, { url: '/auth/login', body }, sessionSchema);
        // El token CSRF de la sesión queda solo en memoria (RNF-06)
        if (result.error === undefined) dispatch(sessionStarted(result.data));
        return result;
      },
    }),
    logout: build.mutation<null, undefined>({
      queryFn: async (_arg, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: '/auth/logout', method: 'POST' }), z.null()),
    }),
    // Comprobación de la sesión al arrancar (plan §5.1, D-1): recupera el usuario y el token CSRF tras recargar
    // 401 o respuesta fuera de contrato: sin sesión que recuperar, se pide iniciarla (RF-08)
    me: build.query<Session, undefined>({
      queryFn: async (_arg, { dispatch }, _extra, baseQuery) => {
        const result = validatedResult(await baseQuery('/me'), sessionSchema);
        dispatch(result.error === undefined ? sessionStarted(result.data) : sessionCheckFailed());
        return result;
      },
      providesTags: ['Me'],
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation, useMeQuery } = authApi;
