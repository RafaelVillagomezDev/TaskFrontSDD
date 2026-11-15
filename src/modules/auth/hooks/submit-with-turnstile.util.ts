import type { FieldValues, UseFormReturn } from 'react-hook-form';

import { AUTH_TEXTS } from '../texts/auth.texts';
import { turnstileErrorMessage } from './turnstile-error.util';
import type { TurnstileWidget } from './use-turnstile.hook';

// Error del formulario reservado al widget de Turnstile
const TURNSTILE_ERROR = 'root.turnstile';
// Tipo del error de RF-03: desaparece en cuanto hay token
const REQUIRED_TYPE = 'required';

// Error de root.turnstile tal como lo devuelve formState
interface TurnstileFormError {
  type?: string | number | undefined;
  message?: string | undefined;
}

// Envía un formulario protegido con Turnstile (spec 005; plan 4.2). Sin token no envía y avisa bajo el widget
// (RF-03); con token lo entrega a send, reinicia el widget pase lo que pase (RF-05) y, si la API rechazó la
// comprobación, muestra su mensaje bajo el widget (RF-08, RF-13, RF-14). Devuelve el resultado para que el
// formulario trate el resto como siempre (RF-15), o undefined si ya está tratado
export async function submitWithTurnstile<T extends FieldValues, R extends { error?: unknown }>(
  form: UseFormReturn<T>,
  turnstile: TurnstileWidget,
  send: (turnstileToken: string) => PromiseLike<R>,
): Promise<R | undefined> {
  if (turnstile.token === null) {
    form.setError(TURNSTILE_ERROR, { type: REQUIRED_TYPE, message: AUTH_TEXTS.turnstile.required });
    return undefined;
  }
  form.clearErrors(TURNSTILE_ERROR);
  const result = await send(turnstile.token);
  turnstile.reset();
  if (result.error === undefined) return result;
  const message = turnstileErrorMessage(result.error);
  if (message === undefined) return result;
  form.setError(TURNSTILE_ERROR, { type: 'api', message });
  return undefined;
}

// Mensaje bajo el widget: primero que no se pudo cargar (RF-06); después el error del envío, salvo el aviso de
// RF-03 cuando ya hay token
export function turnstileFieldError(turnstile: TurnstileWidget, error: TurnstileFormError | undefined): string | undefined {
  if (turnstile.status === 'error') return AUTH_TEXTS.turnstile.loadFailed;
  if (error?.type === REQUIRED_TYPE && turnstile.token !== null) return undefined;
  return error?.message;
}
