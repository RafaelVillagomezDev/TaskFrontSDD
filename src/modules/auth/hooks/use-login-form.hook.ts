import type { BaseSyntheticEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useLocation, useSearchParams } from 'react-router';

import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { REASON_PARAM } from '../../../shared/router/routes.constants';
import { useLoginMutation } from '../api/auth.api';
import { loginSchema, type LoginValues } from '../schemas/login.schema';
import { loginEntry, type LoginNotice } from './login-notice.util';

export interface LoginForm {
  form: UseFormReturn<LoginValues>;
  onSubmit: (event?: BaseSyntheticEvent) => void;
  isSubmitting: boolean;
  notice: LoginNotice;
  // Error general del envío, nunca de un campo concreto
  formError: string | undefined;
}

// Formulario de inicio de sesión. Si va bien, la sesión queda abierta y la ruta de invitado lleva a returnTo
// o al tablero (RF-07); si falla, un mensaje sin el código técnico (RF-04, RF-05, RF-41)
export function useLoginForm(): LoginForm {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { email, notice } = loginEntry(location.state, searchParams.get(REASON_PARAM));
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email, password: '' } });
  const [login, { isLoading }] = useLoginMutation();

  const submit = form.handleSubmit(async (values) => {
    const result = await login(values);
    if (result.error === undefined) return;
    form.setError('root.server', { message: errorMessage(toApiError(result.error).code) });
  });

  return {
    form,
    onSubmit: (event) => {
      void (async () => {
        await submit(event);
      })();
    },
    isSubmitting: isLoading,
    notice,
    formError: form.formState.errors.root?.server?.message,
  };
}
