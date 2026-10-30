import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { showApiError } from '../../../shared/api/api-form-error.util';
import { useAppSelector } from '../../../shared/store/hooks';
import { useSingleSubmit } from '../../../shared/ui/use-single-submit.hook';
import { selectCurrentUser } from '../../auth';
import { useUpdateProfileMutation } from '../api/account.api';
import { profileSchema, type ProfileValues } from '../schemas/profile.schema';
import { ACCOUNT_TEXTS } from '../texts/account.texts';

const PROFILE_FIELDS: readonly (keyof ProfileValues)[] = ['name'];

// Perfil (plan §5.8, RF-38, RF-53): muestra el email y la fecha de alta, y cambia solo el nombre. Al guardar,
// el usuario del slice se actualiza y la navegación muestra el nombre nuevo
export function useProfileForm() {
  const user = useAppSelector(selectCurrentUser);
  const currentName = user?.name ?? '';
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: { name: currentName } });
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [notice, setNotice] = useState<string | undefined>(undefined);

  // Si el nombre cambia fuera del formulario (otra pestaña al recargar la sesión), se muestra el actual
  useEffect(() => {
    form.reset({ name: currentName });
  }, [form, currentName]);

  const submit = form.handleSubmit(async (values) => {
    setNotice(undefined);
    const result = await updateProfile(values);
    if (result.error !== undefined) {
      showApiError(form, result.error, PROFILE_FIELDS);
      return;
    }
    // El nombre tal como quedó guardado (recortado, o vacío si solo eran espacios)
    form.reset({ name: result.data.name ?? '' });
    setNotice(ACCOUNT_TEXTS.profile.saved);
  });

  return {
    form,
    email: user?.email ?? '',
    createdAt: user?.createdAt,
    notice,
    dismissNotice: () => {
      setNotice(undefined);
    },
    isSubmitting: isLoading || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    // Un solo envío a la vez (RF-19)
    onSubmit: useSingleSubmit(submit),
  };
}

export type ProfileForm = ReturnType<typeof useProfileForm>;
