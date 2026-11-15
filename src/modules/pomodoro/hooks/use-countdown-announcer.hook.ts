import { useCallback, useState } from 'react';

import { ANNOUNCE_MILESTONES_SECONDS, SECONDS_PER_MINUTE } from '../schemas/pomodoro.constants';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

const { announce: texts } = POMODORO_TEXTS;

const [FIVE_MINUTES, ONE_MINUTE] = ANNOUNCE_MILESTONES_SECONDS;

// Hito por el que acaba de pasar la cuenta atrás (RF-64, RF-65). Se deriva de los segundos restantes y de los que
// tenía la sesión al llegar (base): un hito solo existe si la sesión empezó o se reanudó por encima de él, así que
// una sesión de 3 minutos no anuncia «quedan 5 minutos». El <output> lo anuncia cuando su texto cambia
export function milestoneMessage(seconds: number, base: number, running: boolean): string {
  if (!running || seconds === 0 || FIVE_MINUTES === undefined || ONE_MINUTE === undefined) return '';
  if (seconds <= ONE_MINUTE) return base > ONE_MINUTE ? texts.oneMinute : '';
  if (seconds <= FIVE_MINUTES) return base > FIVE_MINUTES ? texts.fiveMinutes : '';
  return '';
}

export function minutesLeft(seconds: number): number {
  return Math.ceil(seconds / SECONDS_PER_MINUTE);
}

export type SessionAction = 'started' | 'paused' | 'resumed';

// Anuncios para lectores de pantalla (RF-63 a RF-66, RNF-02): nunca cada segundo. Los cambios de estado los
// anuncia la acción del usuario y el fin, el que detecta la página; los hitos se derivan de la cuenta atrás
export function useCountdownAnnouncer() {
  const [actionMessage, setActionMessage] = useState('');
  const [ended, setEnded] = useState(false);

  const announceAction = useCallback((action: SessionAction, seconds: number) => {
    setEnded(false);
    setActionMessage(texts[action](minutesLeft(seconds)));
  }, []);

  const announceEnd = useCallback(() => {
    setEnded(true);
  }, []);

  return {
    actionMessage,
    // Texto del temporizador: el fin si la página lo ha detectado; si no, el hito actual
    timerMessage: (seconds: number, base: number, running: boolean) =>
      ended ? texts.ended : milestoneMessage(seconds, base, running),
    announceAction,
    announceEnd,
  };
}

export type CountdownAnnouncer = ReturnType<typeof useCountdownAnnouncer>;
