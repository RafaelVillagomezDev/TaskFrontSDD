import { useEffect, useState } from 'react';

import { todayKey } from './day.util';

// Tiempo hasta la próxima medianoche local (no UTC)
export function msUntilNextMidnight(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return nextMidnight.getTime() - now.getTime();
}

// Día actual del dispositivo, que cambia a medianoche y al volver a la pestaña (RF-14).
// Al volver se recalcula siempre: con el equipo suspendido, el temporizador de medianoche puede no haberse ejecutado
export function useCurrentDay(): string {
  const [day, setDay] = useState(() => todayKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleMidnight = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDay(todayKey());
        scheduleMidnight();
      }, msUntilNextMidnight(new Date()));
    };

    const refreshIfVisible = (): void => {
      if (document.visibilityState === 'hidden') return;
      setDay(todayKey());
      scheduleMidnight();
    };

    scheduleMidnight();
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);

    // Limpieza: nada queda registrado ni se actualiza tras desmontar (CONSTITUTION.md VI.6)
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
    };
  }, []);

  return day;
}
