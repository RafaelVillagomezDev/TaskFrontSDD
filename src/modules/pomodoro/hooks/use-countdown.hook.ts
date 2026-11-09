import { useEffect, useState } from 'react';

import { COUNTDOWN_TICK_MS, MS_PER_SECOND, SECONDS_PER_MINUTE } from '../schemas/pomodoro.constants';

interface Clock {
  // Segundos restantes con los que llegó la sesión y el instante (reloj monotónico) en que empezó a contar
  base: number;
  anchor: number;
  now: number;
}

// Segundos restantes de la sesión (RF-15, RF-16, plan D-4). Parte de remainingSeconds de la API y avanza con
// performance.now(), que no cambia si el usuario ajusta la hora del dispositivo; el valor se calcula en cada tic,
// no se acumula, así que es exacto al volver de segundo plano (RNF-01). En pausa no hay intervalo
export function useCountdown(remainingSeconds: number, running: boolean): number {
  const [clock, setClock] = useState<Clock | undefined>(undefined);

  useEffect(() => {
    if (!running) return undefined;
    const anchor = performance.now();
    const tick = () => {
      setClock({ base: remainingSeconds, anchor, now: performance.now() });
    };
    const interval = setInterval(tick, COUNTDOWN_TICK_MS);
    return () => {
      clearInterval(interval);
    };
  }, [remainingSeconds, running]);

  // Hasta el primer tic con los datos actuales, el tiempo es el que dio la API
  if (!running || clock?.base !== remainingSeconds) return remainingSeconds;
  const elapsed = (clock.now - clock.anchor) / MS_PER_SECOND;
  return Math.max(0, Math.ceil(remainingSeconds - elapsed));
}

// «MM:SS» con los minutos sin límite (una sesión de 120 minutos empieza en 120:00)
export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
