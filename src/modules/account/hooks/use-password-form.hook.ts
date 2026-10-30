import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useSingleSubmit } from '../../../shared/ui/use-single-submit.hook';
import { useChangePasswordMutation } from '../api/account.api';
import { passwordSchema, type PasswordValues } from '../schemas/password.schema';
import { ACCOUNT_TEXTS } from '../texts/account.texts';
import { showPasswordFormError } from './account-form-error.util';

const PASSWORD_FIELDS: readonly (keyof PasswordValues)[] = ['currentPassword', 'newPassword'];

const EMPTY_VALUES: PasswordValues = { currentPassword: '', newPassword: '' };

// Cambiar contraseña (plan §5.8, RF-39, RF-48): al acertar, vacía los campos y avisa de que las demás sesiones se
// han cerrado y esta sigue abierta; una contraseña actual incorrecta se marca en su campo
export function usePasswordForm() {
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: EMPTY_VALUES });
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const submit = form.handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await changePassword(values);
    if (result.error !== undefined) {
      showPasswordFormError(form, result.error, 'currentPassword', PASSWORD_FIELDS);
      return;
    }
    form.reset(EMPTY_VALUES);
    setNotice(ACCOUNT_TEXTS.changePassword.changed);
  });

  return {
    form,
    notice,
    dismissNotice: () => {
      setNotice(undefined);
    },
    isSubmitting: isLoading || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    // Un solo envío a la vez (RF-19): un segundo intento fallido contaría para el bloqueo
    onSubmit: useSingleSubmit(submit),
  };
}

export type PasswordForm = ReturnType<typeof usePasswordForm>;
