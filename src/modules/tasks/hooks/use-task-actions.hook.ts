import { useRef, useState } from 'react';

import { errorMessage, toApiError, type ApiErrorCode } from '../../../shared/api/api-error.util';
import { useDeleteTaskMutation, useUpdateTaskMutation } from '../api/tasks.api';
import type { Task } from '../schemas/task.schema';

// Lo que necesita una columna para actuar sobre sus tareas
export interface TaskCardActions {
  toggleCompleted: (task: Task) => void;
  isUpdating: (id: string) => boolean;
  // Al completar o desmarcar, la tarea cambia de lista y se vuelve a montar: su casilla recupera el foco
  keepsFocus: (id: string) => boolean;
  // Pide confirmar la eliminación (RF-23)
  requestDelete: (task: Task) => void;
}

// Lo que necesita el diálogo de confirmar la eliminación
export interface TaskDeletion {
  pendingDelete: Task | undefined;
  isDeleting: boolean;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

interface ActionFailure {
  message: string;
  // Solo si repetir la misma acción puede salir bien (sin conexión o fallo inesperado, RF-44)
  retry: (() => void) | undefined;
}

const RETRIABLE_CODES: readonly ApiErrorCode[] = ['NETWORK_ERROR', 'INTERNAL_ERROR'];

function failureOf(error: unknown, retry: () => void): ActionFailure {
  const { code } = toApiError(error);
  return { message: errorMessage(code), retry: RETRIABLE_CODES.includes(code) ? retry : undefined };
}

// Acciones sobre las tareas del tablero (plan §5.4). Completar y desmarcar son optimistas en la API (D-7);
// eliminar pide confirmación y espera a la API. Aquí se evita repetir una acción mientras se guarda y se explica
// cualquier rechazo (RF-41 a RF-45)
export function useTaskActions() {
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [updatingIds, setUpdatingIds] = useState<ReadonlySet<string>>(new Set());
  const [failure, setFailure] = useState<ActionFailure | undefined>(undefined);
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Task | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  // Un segundo clic llega antes de que se repinte el control: se descarta aquí
  const inFlight = useRef(new Set<string>());
  const deleting = useRef(false);

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
      setFailure(
        failureOf(result.error, () => {
          setCompleted(task, completed);
        }),
      );
    })();
  };

  // La eliminación ya está confirmada: un reintento no vuelve a preguntar
  const runDelete = (task: Task): void => {
    if (deleting.current) return;
    deleting.current = true;
    setIsDeleting(true);
    setFailure(undefined);
    void (async () => {
      const result = await deleteTask(task.id);
      deleting.current = false;
      setIsDeleting(false);
      setPendingDelete(undefined);
      if (result.error === undefined) return;
      setFailure(
        failureOf(result.error, () => {
          runDelete(task);
        }),
      );
    })();
  };

  return {
    toggleCompleted: (task: Task) => {
      setCompleted(task, !task.completed);
    },
    isUpdating: (id: string) => updatingIds.has(id),
    keepsFocus: (id: string) => id === focusedTaskId,
    requestDelete: (task: Task) => {
      setPendingDelete(task);
    },
    pendingDelete,
    isDeleting,
    confirmDelete: () => {
      if (pendingDelete !== undefined) runDelete(pendingDelete);
    },
    cancelDelete: () => {
      setPendingDelete(undefined);
    },
    error: failure?.message,
    retry: failure?.retry,
    dismissError: () => {
      setFailure(undefined);
    },
  };
}

export type TaskActions = ReturnType<typeof useTaskActions>;
