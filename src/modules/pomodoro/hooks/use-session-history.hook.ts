import { errorMessage, toApiError } from '@shared/api/api-error.util';
import { useClampUrlPage, useUrlPage } from '@shared/router/use-url-page.hook';
import { useGetPomodorosQuery } from '../api/pomodoro.api';
import type { Pomodoro } from '../schemas/pomodoro.schema';

export type SessionHistoryStatus = 'loading' | 'error' | 'ready';

const NO_SESSIONS: Pomodoro[] = [];

// Historial de sesiones (RF-38, RF-39): de la más reciente a la más antigua, en el orden de la API, con la página en
// la URL para recargar y compartir. Una página fuera de rango se sustituye por la última. Incluye la sesión activa,
// si la hay, porque la API la devuelve en la misma lista (API-004 RF-18)
export function useSessionHistory() {
  const urlPage = useUrlPage();
  const { currentData, error, isError, refetch } = useGetPomodorosQuery(urlPage.page);
  useClampUrlPage(urlPage, currentData?.totalPages);

  let status: SessionHistoryStatus = 'loading';
  if (currentData !== undefined) status = 'ready';
  else if (isError) status = 'error';

  return {
    status,
    sessions: currentData?.items ?? NO_SESSIONS,
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

export type SessionHistory = ReturnType<typeof useSessionHistory>;
