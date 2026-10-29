import type { BaseSyntheticEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { ROUTES } from '../../../shared/router/routes.constants';
import { useRegisterMutation } from '../api/auth.api';
import { registerSchema, type RegisterValues } from '../schemas/register.schema';
import type { RegisteredState } from './login-notice.util';

type RegisterField = keyof RegisterValues;

const REGISTER_FIELDS: readonly RegisterField[] = ['email', 'password', 'name'];

function isRegisterField(field: string): field is RegisterField {
  return REGISTER_FIELDS.some((candidate) => candidate === field);
}

export interface RegisterForm {
  form: UseFormReturn<RegisterValues>;
  onSubmit: (event?: BaseSyntheticEvent) => void;
  isSubmitting: boolean;
  formError: string | undefined;
}

// Formulario de registro (RF-01 a RF-03): al crear la cuenta lleva al inicio de sesión con el email ya escrito
// y el aviso de cuenta creada; los errores de la API van bajo su campo sin borrar el resto
export function useRegisterForm(): RegisterForm {
  const navigate = useNavigate();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', name: '' },
  });
  const [register, { isLoading }] = useRegisterMutation();

  const submit = form.handleSubmit(async (values) => {
    const result = await register(values);
    if (result.error === undefined) {
      const state: RegisteredState = { registered: true, email: result.data.email };
      await navigate(ROUTES.login, { state });
      return;
    }
    const { code, fieldErrors } = toApiError(result.error);
    if (code === 'EMAIL_ALREADY_REGISTERED') {
      form.setError('email', { message: errorMessage(code) }, { shouldFocus: true });
      return;
    }
    let fieldErrorCount = 0;
    for (const [field, message] of Object.entries(fieldErrors)) {
      if (!isRegisterField(field)) continue;
      form.setError(field, { message });
      fieldErrorCount += 1;
    }
    if (fieldErrorCount === 0) form.setError('root.server', { message: errorMessage(code) });
  });

  return {
    form,
    onSubmit: (event) => {
      void (async () => {
        await submit(event);
      })();
    },
    isSubmitting: isLoading,
    formError: form.formState.errors.root?.server?.message,
  };
}
