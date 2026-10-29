import { z } from 'zod';

import { ERROR_MESSAGES } from '../texts/errors.texts';
import { apiErrorEnvelopeSchema } from './api-envelope.schema';

// Códigos de error de TaskApiSDD (API-001 y API-002) más los del propio cliente: sin red o respuesta inesperada
export type ApiErrorCode =
  | 'ROUTE_NOT_FOUND'
  | 'INVALID_CSRF_TOKEN'
  | 'MISSING_TOKEN'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'INVALID_REFRESH_TOKEN'
  | 'SESSION_EXPIRED'
  | 'INVALID_CLIENT_TIME'
  | 'INVALID_TIMEZONE'
  | 'VALIDATION_ERROR'
  | 'TOO_MANY_ATTEMPTS'
  | 'INVALID_CREDENTIALS'
  | 'WRONG_PASSWORD'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'TASK_NOT_FOUND'
  | 'DAY_CLOSED'
  | 'DAY_NOT_STARTED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

export const API_ERROR_CODES: readonly ApiErrorCode[] = [
  'ROUTE_NOT_FOUND',
  'INVALID_CSRF_TOKEN',
  'MISSING_TOKEN',
  'INVALID_TOKEN',
  'TOKEN_EXPIRED',
  'INVALID_REFRESH_TOKEN',
  'SESSION_EXPIRED',
  'INVALID_CLIENT_TIME',
  'INVALID_TIMEZONE',
  'VALIDATION_ERROR',
  'TOO_MANY_ATTEMPTS',
  'INVALID_CREDENTIALS',
  'WRONG_PASSWORD',
  'EMAIL_ALREADY_REGISTERED',
  'TASK_NOT_FOUND',
  'DAY_CLOSED',
  'DAY_NOT_STARTED',
  'INTERNAL_ERROR',
  'NETWORK_ERROR',
];

export interface ApiError {
  code: ApiErrorCode;
  // Campos que rechazó la API (details de VALIDATION_ERROR). Su texto no se conserva: es el genérico de la
  // validación de la API y puede ser técnico, así que cada formulario muestra el suyo (RF-41)
  invalidFields: string[];
}

// Forma de los errores de fetchBaseQuery de RTK Query
const httpErrorSchema = z.object({ status: z.number(), data: z.unknown() });
const fetchErrorSchema = z.object({ status: z.literal('FETCH_ERROR') });

function isApiErrorCode(value: string): value is ApiErrorCode {
  return API_ERROR_CODES.some((code) => code === value);
}

export function toApiError(error: unknown): ApiError {
  if (fetchErrorSchema.safeParse(error).success) {
    return { code: 'NETWORK_ERROR', invalidFields: [] };
  }
  const http = httpErrorSchema.safeParse(error);
  const envelope = http.success ? apiErrorEnvelopeSchema.safeParse(http.data.data) : null;
  if (envelope?.success !== true || !isApiErrorCode(envelope.data.error.code)) {
    return { code: 'INTERNAL_ERROR', invalidFields: [] };
  }
  const details = envelope.data.error.details ?? [];
  return { code: envelope.data.error.code, invalidFields: details.map((detail) => detail.field) };
}

// Mensaje en español propio de cada código, sin mostrar el código técnico (RF-41)
export function errorMessage(code: ApiErrorCode): string {
  return ERROR_MESSAGES[code];
}
