import type { Page } from '../../../shared/api/api-envelope.schema';
import { baseApi } from '../../../shared/api/base.api';
import { validatedResult } from '../../../shared/api/validated-result.util';
import { alertPageSchema, type Alert } from '../schemas/alert.schema';
import { ALERTS_PAGE_SIZE, LATEST_ALERT_QUERY } from '../schemas/alerts.constants';

// Avisos sobre la API base única (plan D-2), validados con Zod (D-5). Los genera la API a las 22:00 y no cambian
// (API-001 RF-30): ninguna acción de la interfaz los invalida; se vuelven a pedir al volver a la pestaña
export const alertsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Una página de avisos, del más reciente al más antiguo (RF-35)
    getAlerts: build.query<Page<Alert>, number>({
      queryFn: async (page, _api, _extra, baseQuery) =>
        validatedResult(
          await baseQuery({ url: '/alerts', params: { page, pageSize: ALERTS_PAGE_SIZE } }),
          alertPageSchema,
        ),
      providesTags: ['Alert'],
    }),
    // El aviso más reciente, o null si no hay ninguno (RF-37)
    getLatestAlert: build.query<Alert | null, undefined>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const result = validatedResult(
          await baseQuery({ url: '/alerts', params: LATEST_ALERT_QUERY }),
          alertPageSchema,
        );
        return result.error === undefined ? { data: result.data.items[0] ?? null } : result;
      },
      providesTags: ['Alert'],
    }),
  }),
});

export const { useGetAlertsQuery, useGetLatestAlertQuery } = alertsApi;
