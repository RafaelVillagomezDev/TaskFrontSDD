import { useEffect, useState } from 'react';

import { POMODORO_TEXTS } from '../texts/pomodoro.texts';
import { formatClock } from './use-countdown.hook';

const { tabTitle: texts } = POMODORO_TEXTS;

export type TitleState =
  | { kind: 'idle' }
  | { kind: 'running'; seconds: number }
  | { kind: 'paused'; seconds: number }
  | { kind: 'ended'; sessionId: string };

function titleOf(state: TitleState): string | undefined {
  if (state.kind === 'running') return texts.running(formatClock(state.seconds));
  if (state.kind === 'paused') return texts.paused(formatClock(state.seconds));
  if (state.kind === 'ended') return texts.ended;
  return undefined;
}

// Título de la pestaña (RF-57 a RF-60): el tiempo restante en curso o en pausa y «¡Sesión terminada!» tras el fin,
// hasta que el usuario vuelve a la pestaña. Sin sesión, y al salir de la sección, vuelve el título normal
export function usePomodoroTitle(state: TitleState): void {
  // Fin ya visto, por sesión: el de la siguiente sesión vuelve a mostrarse
  const [acknowledgedId, setAcknowledgedId] = useState<string | undefined>(undefined);
  const endedId = state.kind === 'ended' ? state.sessionId : undefined;

  // Restaura el título que había al entrar en la sección (RF-60)
  useEffect(() => {
    const original = document.title;
    return () => {
      document.title = original;
    };
  }, []);

  // Tras el fin, volver a la pestaña lo da por visto (RF-59)
  useEffect(() => {
    if (endedId === undefined) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') setAcknowledgedId(endedId);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [endedId]);

  const title = endedId !== undefined && endedId === acknowledgedId ? undefined : titleOf(state);
  useEffect(() => {
    if (title === undefined) return undefined;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
