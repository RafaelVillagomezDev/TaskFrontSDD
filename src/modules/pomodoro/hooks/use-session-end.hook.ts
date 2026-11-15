import { useEffect, useEffectEvent } from 'react';

import { END_RETRY_DELAY_MS } from '../schemas/pomodoro.constants';

export interface SessionEndOptions {
  // La sesión mostrada está en curso y su cuenta atrás ha llegado a cero
  reachedZero: boolean;
  // Vuelve a consultar la sesión; true si la API aún la da por activa (API-004 RF-15)
  refresh: () => Promise<boolean>;
  // Avisos del fin detectado en la página: sonido, título y anuncio (RF-19, RF-59, RF-66)
  onEnd: () => void;
}

// Fin por tiempo (RF-17, RF-18): al llegar a cero avisa y vuelve a consultar la sesión; si la API aún no la ha
// cerrado (unos milisegundos de diferencia entre relojes, R-5), repite la consulta una sola vez tras un segundo.
// Desmontar antes del reintento lo cancela. refresh y onEnd son eventos (useEffectEvent): silenciar el sonido o un
// nuevo render no vuelven a lanzar el fin; solo lo lanza llegar a cero
export function useSessionEnd({ reachedZero, refresh, onEnd }: SessionEndOptions): void {
  const end = useEffectEvent(onEnd);
  const check = useEffectEvent(refresh);

  useEffect(() => {
    if (!reachedZero) return undefined;
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      end();
      const stillActive = await check();
      if (controller.signal.aborted || !stillActive) return;
      retry = setTimeout(() => {
        void check();
      }, END_RETRY_DELAY_MS);
    })();
    return () => {
      controller.abort();
      clearTimeout(retry);
    };
  }, [reachedZero]);
}
