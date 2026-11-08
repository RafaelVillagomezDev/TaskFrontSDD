import { errorMessage, toApiError } from '@shared/api/api-error.util';
import { useCurrentDay } from '@shared/date/use-current-day.hook';
import { useClampUrlPage, useUrlPage } from '@shared/router/use-url-page.hook';
import { useGetTasksQuery } from '../api/tasks.api';
import type { Task } from '../schemas/task.schema';
import type { PagedTasks, PagedTasksStatus } from '../types/paged-tasks.types';

const NO_TASKS: Task[] = [];

// «Hecho hoy» (spec 002, plan §4.1): las tareas completadas del día actual del dispositivo, paginadas con la página
// en la URL. Reutiliza la consulta del historial (D-1): se vuelve a pedir al completar, desmarcar, editar o eliminar
// (RF-06) y, al cambiar el día, el argumento cambia y se piden las del nuevo día (RF-07)
export function useTaskDay(): PagedTasks {
  const today = useCurrentDay();
  const urlPage = useUrlPage();
  const { page } = urlPage;
  // currentData: al cambiar el día no se muestran ni un instante las tareas del anterior
  const { currentData, error, isError, refetch } = useGetTasksQuery({
    status: 'completed',
    from: today,
    to: today,
    page,
  });
  useClampUrlPage(urlPage, currentData?.totalPages);

  let status: PagedTasksStatus = 'loading';
  if (currentData !== undefined) status = 'ready';
  else if (isError) status = 'error';

  return {
    status,
    tasks: currentData?.items ?? NO_TASKS,
    page,
    totalPages: currentData?.totalPages ?? 0,
    totalItems: currentData?.totalItems ?? 0,
    goToPage: (next: number) => {
      urlPage.goToPage(next);
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
