import { baseApi } from '../../../shared/api/base.api';
import { validatedResult } from '../../../shared/api/validated-result.util';
import { streakSchema, type Streak } from '../schemas/streak.schema';

// Racha sobre la API base única (plan D-2), validada con Zod (D-5). Completar, desmarcar, crear o eliminar
// una tarea invalida la etiqueta Streak y la racha se vuelve a pedir (plan §4)
export const streaksApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStreak: build.query<Streak, undefined>({
      queryFn: async (_arg, _api, _extra, baseQuery) => validatedResult(await baseQuery('/streak'), streakSchema),
      providesTags: ['Streak'],
    }),
  }),
});

export const { useGetStreakQuery } = streaksApi;
