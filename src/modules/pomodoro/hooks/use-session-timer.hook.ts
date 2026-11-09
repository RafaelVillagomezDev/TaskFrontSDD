import { useState } from 'react';

import type { ActiveSession } from './use-active-session.hook';
import { useCountdown } from './use-countdown.hook';
import { useCountdownAnnouncer } from './use-countdown-announcer.hook';
import { useEndSound } from './use-end-sound.hook';
import { usePomodoroTitle, type TitleState } from './use-pomodoro-title.hook';
import { useSessionEnd } from './use-session-end.hook';

// Temporizador de /pomodoro (RF-15 a RF-19, RF-57 a RF-66): une la cuenta atrás de la sesión activa con sus avisos.
// Solo el fin que detecta la página (la cuenta atrás llega a cero con ella abierta) suena, cambia el título y se
// anuncia; tras recargar con el resultado ya en la URL no hay avisos (casos límite de la spec)
export function useSessionTimer({ view, refresh }: Pick<ActiveSession, 'view' | 'refresh'>) {
  const session = view.kind === 'session' ? view.session : undefined;
  const running = session?.status === 'running';
  const base = session?.remainingSeconds ?? 0;
  const seconds = useCountdown(base, running);
  const sound = useEndSound();
  const announcer = useCountdownAnnouncer();
  const [endedHereId, setEndedHereId] = useState<string | undefined>(undefined);

  useSessionEnd({
    reachedZero: running && seconds === 0,
    refresh,
    onEnd: () => {
      setEndedHereId(session?.id);
      sound.play();
      announcer.announceEnd();
    },
  });

  usePomodoroTitle(titleState(view, seconds, endedHereId));

  return {
    seconds,
    sound,
    announcer,
    timerMessage: announcer.timerMessage(seconds, base, running),
  };
}

export type SessionTimer = ReturnType<typeof useSessionTimer>;

function titleState(view: ActiveSession['view'], seconds: number, endedHereId: string | undefined): TitleState {
  if (view.kind === 'session') return { kind: view.session.status === 'paused' ? 'paused' : 'running', seconds };
  if (view.kind === 'result' && view.id === endedHereId) return { kind: 'ended', sessionId: view.id };
  return { kind: 'idle' };
}
