import { useState } from 'react';

import { errorMessage, toApiError } from '@shared/api/api-error.util';
import {
  useChangePomodoroStatusMutation,
  useRemovePomodoroTaskMutation,
  useUpdatePomodoroTaskMutation,
} from '../api/pomodoro.api';
import type { Pomodoro, PomodoroTask } from '../schemas/pomodoro.schema';
import type { SessionAction } from './use-countdown-announcer.hook';

export interface SessionActionsOptions {
  // Sesión activa mostrada
  session: Pomodoro | undefined;
  // En el gesto de reanudar: prepara el sonido de fin (plan D-5)
  primeSound: () => void;
  // Anuncia a los lectores de pantalla pausar y reanudar (RF-63)
  announce: (action: SessionAction, seconds: number) => void;
  // Tras terminar a mano se muestra su resultado (RF-27, RF-72)
  showResult: (id: string) => void;
}

interface Outcome {
  error?: unknown;
}

// Acciones sobre la sesión activa y sus tareas (RF-22 a RF-26, RF-30, RF-48). Sin cambio optimista (plan D-2): la pantalla
// cambia cuando responde la API. Mientras se guarda una tarea, su casilla no se puede volver a pulsar. Un rechazo muestra su
// mensaje y la API vuelve a pedir el estado real (RF-48)
export function useSessionActions({ session, primeSound, announce, showResult }: SessionActionsOptions) {
  const [updateTask] = useUpdatePomodoroTaskMutation();
  const [removeTask] = useRemovePomodoroTaskMutation();
  const [changeStatus, { isLoading: isChangingStatus }] = useChangePomodoroStatusMutation();
  const [savingTaskId, setSavingTaskId] = useState<string | undefined>(undefined);
  const [actionError, setActionError] = useState<string | undefined>(undefined);
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  // Muestra el error de la acción, si lo hubo; devuelve true si salió bien
  const settle = (outcome: Outcome): boolean => {
    if (outcome.error === undefined) return true;
    setActionError(errorMessage(toApiError(outcome.error).code));
    return false;
  };

  const changeTo = async (status: Pomodoro['status']): Promise<Pomodoro | undefined> => {
    if (session === undefined) return undefined;
    setActionError(undefined);
    const outcome = await changeStatus({ id: session.id, status });
    return settle(outcome) ? outcome.data : undefined;
  };

  return {
    savingTaskId,
    actionError,
    isChangingStatus,
    confirmingFinish,
    dismissError: () => {
      setActionError(undefined);
    },
    // Completar o desmarcar una tarea de la sesión activa (RF-22)
    toggleTask: async (task: PomodoroTask) => {
      setSavingTaskId(task.id);
      setActionError(undefined);
      settle(await updateTask({ id: task.id, changes: { completed: !task.completed } }));
      setSavingTaskId(undefined);
    },
    // Quitar una tarea pendiente de la sesión: pasa a espera (RF-30, API-004 RF-26)
    removeTask: async (task: PomodoroTask) => {
      if (session === undefined) return;
      setSavingTaskId(task.id);
      setActionError(undefined);
      settle(await removeTask({ id: session.id, taskId: task.id }));
      setSavingTaskId(undefined);
    },
    // Pausar (RF-23): la cuenta atrás se detiene en el tiempo que devuelve la API
    pause: async () => {
      const paused = await changeTo('paused');
      if (paused !== undefined) announce('paused', paused.remainingSeconds);
    },
    // Reanudar (RF-24) en el gesto del usuario, que también prepara el sonido
    resume: async () => {
      primeSound();
      const resumed = await changeTo('running');
      if (resumed !== undefined) announce('resumed', resumed.remainingSeconds);
    },
    // Terminar pide confirmación antes de llamar a la API (RF-25, RF-26)
    requestFinish: () => {
      setConfirmingFinish(true);
    },
    cancelFinish: () => {
      setConfirmingFinish(false);
    },
    confirmFinish: async () => {
      setConfirmingFinish(false);
      const finished = await changeTo('finished');
      if (finished !== undefined) showResult(finished.id);
    },
  };
}

export type SessionActions = ReturnType<typeof useSessionActions>;
