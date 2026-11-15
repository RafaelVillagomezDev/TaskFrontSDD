import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { ROUTES } from '@shared/router/routes.constants';
import { announceSessionEnd } from '@shared/session/session-channel.util';
import { useAppDispatch } from '@shared/store/hooks';
import { useSingleSubmit } from '@shared/ui/use-single-submit.hook';
import { sessionEnded } from '@modules/auth';
import { useDeleteAccountMutation } from '../api/account.api';
import { deleteAccountSchema, type DeleteAccountValues } from '../schemas/delete-account.schema';
import { showPasswordFormError } from './account-form-error.util';

const DELETE_FIELDS: readonly (keyof DeleteAccountValues)[] = ['password'];

const EMPTY_VALUES: DeleteAccountValues = { password: '' };

// Borrar la cuenta (plan §5.8, RF-49): un diálogo avisa de lo que se elimina y pide la contraseña. Al acertar,
// vacía la sesión y lleva al inicio de sesión reemplazando la entrada, como cerrar sesión: la caché la borra el
// listener de fin de sesión y las demás pestañas se enteran por el canal de sesión (spec 004 RF-01, RF-04)
export function useDeleteAccount() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const form = useForm<DeleteAccountValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: EMPTY_VALUES,
  });
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
  const [isOpen, setIsOpen] = useState(false);

  const submit = form.handleSubmit(async (values) => {
    const result = await deleteAccount(values);
    if (result.error !== undefined) {
      showPasswordFormError(form, result.error, 'password', DELETE_FIELDS);
      return;
    }
    dispatch(sessionEnded());
    announceSessionEnd('signedOut');
    await navigate(ROUTES.login, { replace: true });
  });

  return {
    form,
    isOpen,
    // Cada vez que se abre se empieza sin contraseña escrita
    onOpenChange: (open: boolean) => {
      if (open) form.reset(EMPTY_VALUES);
      setIsOpen(open);
    },
    isDeleting: isLoading || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    onSubmit: useSingleSubmit(submit),
  };
}

export type AccountDeletion = ReturnType<typeof useDeleteAccount>;
