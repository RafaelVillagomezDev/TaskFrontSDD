import { skipToken } from '@reduxjs/toolkit/query/react';
import { useParams } from 'react-router';

import { errorMessage, toApiError, type ApiErrorCode } from '@shared/api/api-error.util';
import { useGetPomodoroQuery } from '../api/pomodoro.api';

export type SessionDetailStatus = 'loading' | 'error' | 'notFound' | 'ready';

// Errores que significan que la sesión del enlace no existe para este usuario (RF-49, API-004 RF-20). Un id con un
// formato que la API no acepta (URL escrita a mano) tampoco es una sesión: reintentar no lo arreglaría
const NOT_FOUND_CODES: readonly ApiErrorCode[] = ['POMODORO_NOT_FOUND', 'VALIDATION_ERROR'];

// Detalle de una sesión del historial en /pomodoro/history/:id (RF-40, RF-49, RF-54): la API devuelve sus tareas
// como estaban al terminar (API-004 RF-16)
export function useSessionDetail() {
  const { id } = useParams();
  const { data: session, error, isError, refetch } = useGetPomodoroQuery(id ?? skipToken);
  const code = isError ? toApiError(error).code : undefined;

  let status: SessionDetailStatus = 'loading';
  if (session !== undefined) status = 'ready';
  else if (code !== undefined) status = NOT_FOUND_CODES.includes(code) ? 'notFound' : 'error';

  return {
    status,
    session,
    errorMessage: status === 'error' && code !== undefined ? errorMessage(code) : undefined,
    // El resultado del reintento llega por la propia consulta
    retry: () => {
      void (async () => {
        await refetch();
      })();
    },
  };
}

export type SessionDetail = ReturnType<typeof useSessionDetail>;
