import { baseApi } from '../../../shared/api/base.api';
import { validatedResult } from '../../../shared/api/validated-result.util';
import { userSchema, userUpdated, type User } from '../../auth';
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
  }),
});

export const { useUpdateProfileMutation } = accountApi;
