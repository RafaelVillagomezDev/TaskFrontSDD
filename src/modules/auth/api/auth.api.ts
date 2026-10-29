import { apiSuccessSchema } from '../../../shared/api/api-envelope.schema';
import { baseApi } from '../../../shared/api/base.api';
import { sessionSchema, type Session } from '../schemas/user.schema';
import { sessionCheckFailed, sessionStarted } from '../store/auth.slice';

const meResponseSchema = apiSuccessSchema(sessionSchema);

// Endpoints de auth sobre la API base única (plan D-2); la respuesta se valida con Zod (D-5)
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Comprobación de la sesión al arrancar (plan §5.1, D-1): recupera el usuario y el token CSRF tras recargar
    me: build.query<Session, undefined>({
      query: () => '/me',
      transformResponse: (response: unknown) => meResponseSchema.parse(response).data,
      providesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionStarted(data));
        } catch {
          // 401 o respuesta fuera de contrato: sin sesión que recuperar, se pide iniciarla (RF-08)
          dispatch(sessionCheckFailed());
        }
      },
    }),
  }),
});

export const { useMeQuery } = authApi;
