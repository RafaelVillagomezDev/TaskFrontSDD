import { useCallback } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useSearchParams } from 'react-router';

import { errorMessage, toApiError } from '@shared/api/api-error.util';
import { useAppDispatch } from '@shared/store/hooks';
import { pomodoroApi, sessionEndedTags, useGetPomodoroQuery, useGetPomodorosQuery } from '../api/pomodoro.api';
import { FIRST_PAGE } from '../schemas/pomodoro.constants';
import type { Pomodoro } from '../schemas/pomodoro.schema';

// Sesión terminada en la página cuyo resultado se muestra (RF-72, plan D-12): en la URL, así sobrevive a una recarga
export const RESULT_PARAM = 'result';

export type SessionView =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'form' }
  | { kind: 'session'; session: Pomodoro }
  | { kind: 'result'; id: string; session: Pomodoro | undefined };

// Lo que muestra /pomodoro (RF-03 a RF-05, RF-71, RF-72, plan D-3). La sesión activa es la primera de
// GET /pomodoros?page=1 si está en curso o pausada (S-03); sus datos salen de getPomodoro(id), que recibe al instante
// la respuesta de pausar, reanudar, añadir y quitar. Una sesión que termina con la página abierta deja su resultado
// en la URL hasta que el usuario elige empezar otra; la que termina con la página cerrada se consulta en el historial
export function useActiveSession() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const list = useGetPomodorosQuery(FIRST_PAGE);
  const latest = list.data?.items[0];
  const activeId = latest !== undefined && latest.status !== 'finished' ? latest.id : undefined;
  const detail = useGetPomodoroQuery(activeId ?? skipToken);
  const resultId = searchParams.get(RESULT_PARAM) ?? undefined;
  const result = useGetPomodoroQuery(resultId ?? skipToken);

  const showResult = useCallback(
    (id: string) => {
      setSearchParams({ [RESULT_PARAM]: id }, { replace: true });
    },
    [setSearchParams],
  );

  // Vuelve a consultar la sesión al llegar a cero (RF-17): si ya terminó, muestra su resultado y se vuelven a pedir
  // la lista, las tareas en espera y la racha; devuelve true si la API aún la da por activa (RF-18)
  const refresh = useCallback(async (): Promise<boolean> => {
    if (activeId === undefined) return false;
    const { data } = await dispatch(pomodoroApi.endpoints.getPomodoro.initiate(activeId, { forceRefetch: true }));
    if (data?.status !== 'finished') return true;
    showResult(activeId);
    dispatch(pomodoroApi.util.invalidateTags(sessionEndedTags()));
    return false;
  }, [activeId, dispatch, showResult]);

  return {
    view: sessionView({ list, active: activeSession(activeId, detail.data, latest), resultId, result }),
    showResult,
    refresh,
    // «Empezar otra sesión» (RF-71): sin resultado en la URL se ve el formulario
    clearResult: () => {
      setSearchParams({}, { replace: true });
    },
    retry: () => {
      void (async () => {
        await list.refetch();
      })();
    },
  };
}

// La sesión activa con sus datos más recientes; si su detalle ya llega terminado (fin por tiempo recién detectado),
// deja de ser activa aunque la lista aún no se haya vuelto a pedir
function activeSession(
  activeId: string | undefined,
  detail: Pomodoro | undefined,
  latest: Pomodoro | undefined,
): Pomodoro | undefined {
  if (activeId === undefined) return undefined;
  const session = detail ?? latest;
  return session?.status === 'finished' ? undefined : session;
}

interface ViewSources {
  list: { data?: unknown; isError: boolean; error?: unknown };
  active: Pomodoro | undefined;
  resultId: string | undefined;
  result: { data?: Pomodoro | undefined };
}

function sessionView({ list, active, resultId, result }: ViewSources): SessionView {
  if (list.data === undefined) {
    return list.isError ? { kind: 'error', message: errorMessage(toApiError(list.error).code) } : { kind: 'loading' };
  }
  if (active !== undefined) return { kind: 'session', session: active };
  if (resultId !== undefined) return { kind: 'result', id: resultId, session: result.data };
  return { kind: 'form' };
}

export type ActiveSession = ReturnType<typeof useActiveSession>;
