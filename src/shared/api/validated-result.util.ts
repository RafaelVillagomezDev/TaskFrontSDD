import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { z } from 'zod';

import { apiSuccessSchema } from './api-envelope.schema';

// Resultado de una petición dentro de un queryFn de RTK Query
export type ApiResult<T> = { data: T; error?: undefined } | { error: FetchBaseQueryError; data?: undefined };

export interface RawResult {
  data?: unknown;
  error?: FetchBaseQueryError | undefined;
}

// baseQuery que RTK Query pasa a un queryFn, ya ligado a la petición en curso
export type BoundBaseQuery = (arg: string | FetchArgs) => RawResult | PromiseLike<RawResult>;

// Error del cliente cuando la respuesta no cumple el contrato: toApiError lo trata como INTERNAL_ERROR (RF-44)
export const CONTRACT_ERROR: FetchBaseQueryError = {
  status: 'CUSTOM_ERROR',
  error: 'La respuesta de la API no cumple su contrato',
};

// Valida el sobre de éxito y su data con Zod en lugar de dar la respuesta por buena (plan D-5)
export function validatedResult<T>(result: RawResult, dataSchema: z.ZodType<T>): ApiResult<T> {
  if (result.error !== undefined) return { error: result.error };
  const parsed = apiSuccessSchema(dataSchema).safeParse(result.data);
  return parsed.success ? { data: parsed.data.data } : { error: CONTRACT_ERROR };
}
