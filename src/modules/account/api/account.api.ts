import { z } from 'zod';

import { baseApi } from '../../../shared/api/base.api';
import { validatedResult } from '../../../shared/api/validated-result.util';
import { userSchema, userUpdated, type User } from '../../auth';
import type { DeleteAccountValues } from '../schemas/delete-account.schema';
import type { PasswordValues } from '../schemas/password.schema';
import type { ProfileValues } from '../schemas/profile.schema';

// Endpoints de la cuenta sobre la API base única (plan D-2), validados con Zod (D-5)
export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // PATCH /me (plan §5.8): un nombre vacío se envía como null y lo borra (API-002 RF-05). El usuario guardado
    // pasa al slice, de donde lo lee la navegación (RF-53)
    updateProfile: build.mutation<User, ProfileValues>({
      queryFn: async ({ name }, { dispatch }, _extra, baseQuery) => {
        const body = { name: name === '' ? null : name };
        const result = validatedResult(await baseQuery({ url: '/me', method: 'PATCH', body }), userSchema);
        if (result.error === undefined) dispatch(userUpdated(result.data));
        return result;
      },
      invalidatesTags: (_result, error) => (error === undefined ? ['Me'] : []),
    }),
    // PATCH /me/password (RF-39): la API cierra las demás sesiones y mantiene esta (API-002 RF-27)
    changePassword: build.mutation<null, PasswordValues>({
      queryFn: async (body, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: '/me/password', method: 'PATCH', body }), z.null()),
    }),
    // DELETE /me (RF-49): borra la cuenta, sus tareas, sus avisos y sus sesiones (API-002 RF-29). Vaciar la sesión
    // y la caché le toca a quien llama, que además navega
    deleteAccount: build.mutation<null, DeleteAccountValues>({
      queryFn: async (body, _api, _extra, baseQuery) =>
        validatedResult(await baseQuery({ url: '/me', method: 'DELETE', body }), z.null()),
    }),
  }),
});

export const { useUpdateProfileMutation, useChangePasswordMutation, useDeleteAccountMutation } = accountApi;
