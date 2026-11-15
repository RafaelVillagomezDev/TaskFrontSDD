import type { BaseSyntheticEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useLocation, useSearchParams } from 'react-router';

import { errorMessage, toApiError } from '@shared/api/api-error.util';
import { REASON_PARAM } from '@shared/router/routes.constants';
import { useSingleSubmit } from '@shared/ui/use-single-submit.hook';
import { useLoginMutation } from '../api/auth.api';
import { loginSchema, type LoginValues } from '../schemas/login.schema';
import { loginEntry, type LoginNotice } from './login-notice.util';
import { submitWithTurnstile, turnstileFieldError } from './submit-with-turnstile.util';
import { useTurnstile, type TurnstileWidget } from './use-turnstile.hook';

export interface LoginForm {
  form: UseFormReturn<LoginValues>;
  onSubmit: (event?: BaseSyntheticEvent) => void;
  isSubmitting: boolean;
  notice: LoginNotice;
  // Error general del envío, nunca de un campo concreto
  formError: string | undefined;
  // Widget de Turnstile y su mensaje (spec 005)
  turnstile: TurnstileWidget;
  turnstileError: string | undefined;
}

// Formulario de inicio de sesión. Si va bien, la sesión queda abierta y la ruta de invitado lleva a returnTo
// o al tablero (RF-07); si falla, un mensaje sin el código técnico (RF-04, RF-05, RF-41). Solo se envía con el
// token de Turnstile, que se renueva tras cada intento (spec 005 RF-03, RF-05, RF-07)
export function useLoginForm(): LoginForm {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { email, notice } = loginEntry(location.state, searchParams.get(REASON_PARAM));
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email, password: '' } });
  const [login, { isLoading }] = useLoginMutation();
  const turnstile = useTurnstile('login');

  const submit = form.handleSubmit(async (values) => {
    const result = await submitWithTurnstile(form, turnstile, (turnstileToken) =>
      login({ ...values, turnstileToken }),
    );
    if (result?.error === undefined) return;
    form.setError('root.server', { message: errorMessage(toApiError(result.error).code) });
  });

  // Un solo envío a la vez: un doble clic no repite la petición (RF-19)
  const onSubmit = useSingleSubmit(submit);

  return {
    form,
    onSubmit,
    isSubmitting: isLoading,
    notice,
    formError: form.formState.errors.root?.server?.message,
    turnstile,
    turnstileError: turnstileFieldError(turnstile, form.formState.errors.root?.turnstile),
  };
}
