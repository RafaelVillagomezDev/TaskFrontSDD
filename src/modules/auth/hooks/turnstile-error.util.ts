import { errorMessage, toApiError } from '@shared/api/api-error.util';

// Campo del cuerpo que lleva el token de Turnstile (API-005 RF-01)
export const TURNSTILE_TOKEN_FIELD = 'turnstileToken';

// Mensaje bajo el widget si la API rechazó la comprobación de Turnstile; undefined si el error es de otra cosa
// y el formulario lo trata como siempre (spec 005 RF-08, RF-13 a RF-15, plan D-6)
export function turnstileErrorMessage(error: unknown): string | undefined {
  const { code, invalidFields } = toApiError(error);
  if (code === 'TURNSTILE_FAILED' || code === 'TURNSTILE_UNAVAILABLE') return errorMessage(code);
  // El usuario no puede corregir el token en ningún campo: se trata como una comprobación fallida (RF-14)
  if (code === 'VALIDATION_ERROR' && invalidFields.includes(TURNSTILE_TOKEN_FIELD)) {
    return errorMessage('TURNSTILE_FAILED');
  }
  return undefined;
}
