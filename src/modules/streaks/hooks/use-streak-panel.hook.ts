import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { useGetStreakQuery } from '../api/streaks.api';
import type { TodayProgress } from '../types/streak.types';

export type StreakPanelStatus = 'loading' | 'error' | 'ready';

// Panel de racha y progreso de hoy (plan §5.5, RF-25 a RF-28). La racha es la de GET /streak, sin recalcular
// (RF-25); el progreso llega del tablero, que ya tiene las tareas de hoy, sin pedir nada más (undefined mientras carga).
// isSavingProgress: el tablero tiene un completar o desmarcar sin guardar; su progreso es optimista (D-7) y la racha
// no se recalcula hasta que la API lo guarda
export function useStreakPanel(progress: TodayProgress | undefined, isSavingProgress = false) {
  const { data: streak, error, isError, isFetching, refetch } = useGetStreakQuery(undefined);
  let status: StreakPanelStatus = 'loading';
  if (streak !== undefined) status = 'ready';
  else if (isError) status = 'error';

  return {
    status,
    streak,
    progress,
    errorMessage: status === 'error' ? errorMessage(toApiError(error).code) : undefined,
    // Sin tareas hoy: «Sin tareas hoy» con la opción de crear una (RF-28)
    hasNoTasksToday: progress?.total === 0,
    // La racha está en juego si hoy aún no hay ninguna completada (RF-27, API-001 RF-20). Solo con la racha que
    // corresponde al progreso mostrado: mientras un cambio se guarda o la racha se vuelve a pedir, la anterior ya
    // no vale y el aviso parpadearía (clarificación de RF-27, T115)
    atRisk:
      !isSavingProgress &&
      !isFetching &&
      progress !== undefined &&
      streak !== undefined &&
      progress.done === 0 &&
      streak.current > 0,
    // El resultado del reintento llega por la propia consulta
    retry: () => {
      void (async () => {
        await refetch();
      })();
    },
  };
}
