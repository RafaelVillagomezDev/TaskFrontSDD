import type { BaseSyntheticEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { showApiError } from '../../../shared/api/api-form-error.util';
import { ROUTES } from '../../../shared/router/routes.constants';
import { useSingleSubmit } from '../../../shared/ui/use-single-submit.hook';
import { useRegisterMutation } from '../api/auth.api';
import { registerSchema, type RegisterValues } from '../schemas/register.schema';
import type { RegisteredState } from './login-notice.util';

const REGISTER_FIELDS: readonly (keyof RegisterValues)[] = ['email', 'password', 'name'];

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
    const { code } = toApiError(result.error);
    if (code === 'EMAIL_ALREADY_REGISTERED') {
      form.setError('email', { message: errorMessage(code) }, { shouldFocus: true });
      return;
    }
    showApiError(form, result.error, REGISTER_FIELDS);
  });

  // Un solo envío a la vez: un doble clic no repite la petición (RF-19)
  const onSubmit = useSingleSubmit(submit);

  return {
    form,
    onSubmit,
    isSubmitting: isLoading,
    formError: form.formState.errors.root?.server?.message,
  };
}
