import { useState } from 'react';

import { errorMessage, toApiError } from '@shared/api/api-error.util';
import { compareDays } from '@shared/date/day.util';
import { useCurrentDay } from '@shared/date/use-current-day.hook';
import { useClampUrlPage, useUrlPage } from '@shared/router/use-url-page.hook';
import { useDeleteWaitingTaskMutation, useGetWaitingTasksQuery } from '../api/pomodoro.api';
import type { PomodoroTask } from '../schemas/pomodoro.schema';

export interface WaitingItem {
  task: PomodoroTask;
  // Su fecha ya pasó: al incluirla en una sesión tomará la de hoy (RF-37, API-004 RF-21)
  takesToday: boolean;
}

// Tareas en espera (RF-32 a RF-34, RF-37): paginadas en el orden de la API (fecha ascendente) con la página en la
// URL, y borrar con confirmación (RF-33). No se pueden completar (RF-34). Un rechazo (por ejemplo, la tarea entró en
// la sesión desde otra pestaña: POMODORO_TASK_IN_SESSION) muestra su mensaje y la API vuelve a pedir la lista (RF-48)
export function useWaitingTasks() {
  const today = useCurrentDay();
  const urlPage = useUrlPage();
  const { currentData, isError, error, refetch } = useGetWaitingTasksQuery(urlPage.page);
  const [deleteTask, { isLoading: isDeleting }] = useDeleteWaitingTaskMutation();
  const [pendingDelete, setPendingDelete] = useState<PomodoroTask | undefined>(undefined);
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  useClampUrlPage(urlPage, currentData?.totalPages);

  const items: WaitingItem[] = (currentData?.items ?? []).map((task) => ({
    task,
    takesToday: compareDays(task.date, today) < 0,
  }));

  return {
    items,
    page: urlPage.page,
    totalPages: currentData?.totalPages ?? 0,
    totalItems: currentData?.totalItems ?? 0,
    errorMessage: isError ? errorMessage(toApiError(error).code) : undefined,
    actionError,
    pendingDelete,
    isDeleting,
    goToPage: (page: number) => {
      urlPage.goToPage(page);
    },
    retry: () => {
      void (async () => {
        await refetch();
      })();
    },
    requestDelete: (task: PomodoroTask) => {
      setActionError(undefined);
      setPendingDelete(task);
    },
    cancelDelete: () => {
      setPendingDelete(undefined);
    },
    confirmDelete: async () => {
      if (pendingDelete === undefined) return;
      const result = await deleteTask(pendingDelete.id);
      setPendingDelete(undefined);
      if (result.error !== undefined) setActionError(errorMessage(toApiError(result.error).code));
    },
    dismissError: () => {
      setActionError(undefined);
    },
  };
}

export type WaitingTasks = ReturnType<typeof useWaitingTasks>;
