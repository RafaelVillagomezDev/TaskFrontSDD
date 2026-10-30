import { useRef, useState } from 'react';

import { errorMessage, toApiError, type ApiErrorCode } from '../../../shared/api/api-error.util';
import { useUpdateTaskMutation } from '../api/tasks.api';
import type { Task } from '../schemas/task.schema';

// Lo que necesita una columna para completar sus tareas
export interface TaskCompletion {
  toggleCompleted: (task: Task) => void;
  isUpdating: (id: string) => boolean;
  // Al completar o desmarcar, la tarea cambia de lista y se vuelve a montar: su casilla recupera el foco
  keepsFocus: (id: string) => boolean;
}

interface ActionFailure {
  message: string;
  // Solo si repetir el mismo cambio puede salir bien (sin conexión o fallo inesperado, RF-44)
  retry: (() => void) | undefined;
}

const RETRIABLE_CODES: readonly ApiErrorCode[] = ['NETWORK_ERROR', 'INTERNAL_ERROR'];

// Acciones sobre las tareas del tablero (plan §5.4). Completar y desmarcar son optimistas en la API (D-7);
// aquí se evita repetir el cambio de una tarea mientras se guarda y se explica cualquier rechazo (RF-41 a RF-45)
export function useTaskActions() {
  const [updateTask] = useUpdateTaskMutation();
  const [updatingIds, setUpdatingIds] = useState<ReadonlySet<string>>(new Set());
  const [failure, setFailure] = useState<ActionFailure | undefined>(undefined);
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>(undefined);
  // Un segundo clic llega antes de que se repinte la casilla deshabilitada: se descarta aquí
  const inFlight = useRef(new Set<string>());

  const markUpdating = (id: string, updating: boolean): void => {
    if (updating) inFlight.current.add(id);
    else inFlight.current.delete(id);
    setUpdatingIds(new Set(inFlight.current));
  };

  const setCompleted = (task: Task, completed: boolean): void => {
    if (inFlight.current.has(task.id)) return;
    markUpdating(task.id, true);
    setFocusedTaskId(task.id);
    setFailure(undefined);
    void (async () => {
      const result = await updateTask({ id: task.id, changes: { completed } });
      markUpdating(task.id, false);
      // Ya se movió de lista: un remontaje posterior (otra semana, recarga) no debe robar el foco
      setFocusedTaskId(undefined);
      if (result.error === undefined) return;
      const { code } = toApiError(result.error);
      setFailure({
        message: errorMessage(code),
        retry: RETRIABLE_CODES.includes(code)
          ? () => {
              setCompleted(task, completed);
            }
          : undefined,
      });
    })();
  };

  return {
    toggleCompleted: (task: Task) => {
      setCompleted(task, !task.completed);
    },
    isUpdating: (id: string) => updatingIds.has(id),
    keepsFocus: (id: string) => id === focusedTaskId,
    error: failure?.message,
    retry: failure?.retry,
    dismissError: () => {
      setFailure(undefined);
    },
  };
}

export type TaskActions = ReturnType<typeof useTaskActions>;
