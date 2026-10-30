import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { useClampUrlPage, useUrlPage } from '../../../shared/router/use-url-page.hook';
import { useGetAlertsQuery } from '../api/alerts.api';
import type { Alert } from '../schemas/alert.schema';

export type AlertsPageStatus = 'loading' | 'error' | 'ready';

const NO_ALERTS: Alert[] = [];

// Pantalla de avisos (plan §5.7, RF-35): página en la URL (?page=n) y, al volver a la pestaña, se vuelve a pedir
// por si la API generó uno nuevo
export function useAlertsPage() {
  const urlPage = useUrlPage();
  const { currentData, error, isError, refetch } = useGetAlertsQuery(urlPage.page, { refetchOnFocus: true });
  useClampUrlPage(urlPage, currentData?.totalPages);

  let status: AlertsPageStatus = 'loading';
  if (currentData !== undefined) status = 'ready';
  else if (isError) status = 'error';

  return {
    status,
    alerts: currentData?.items ?? NO_ALERTS,
    page: urlPage.page,
    totalPages: currentData?.totalPages ?? 0,
    totalItems: currentData?.totalItems ?? 0,
    goToPage: (page: number) => {
      urlPage.goToPage(page);
    },
    errorMessage: status === 'error' ? errorMessage(toApiError(error).code) : undefined,
    // El resultado del reintento llega por la propia consulta
    retry: () => {
      void (async () => {
        await refetch();
      })();
    },
  };
}

export type AlertsPageModel = ReturnType<typeof useAlertsPage>;
