import { useCallback, useEffect, useRef, useState } from 'react';

import {
  END_SOUND_DURATION_MS,
  END_SOUND_FREQUENCY_HZ,
  END_SOUND_GAIN,
  MS_PER_SECOND,
} from '../schemas/pomodoro.constants';

// Sonido de fin de sesión (RF-19, RF-61, RF-62, plan D-5): un tono generado con Web Audio, sin fichero ni
// dependencia. Los navegadores solo dejan sonar audio tras un gesto del usuario, así que el contexto se crea en el
// gesto de empezar o reanudar (prime). Tras recargar no hay gesto: no suena y no se muestra ningún error. El
// silencio es estado de la interfaz y no se guarda (D-6)
export function useEndSound() {
  const context = useRef<AudioContext | undefined>(undefined);
  const [muted, setMuted] = useState(false);

  useEffect(
    () => () => {
      const audio = context.current;
      context.current = undefined;
      if (audio !== undefined) void audio.close();
    },
    [],
  );

  const prime = useCallback(() => {
    if (typeof AudioContext === 'undefined') return;
    context.current ??= new AudioContext();
    if (context.current.state === 'suspended') void context.current.resume();
  }, []);

  const play = useCallback(() => {
    const audio = context.current;
    if (muted || audio?.state !== 'running') return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.frequency.value = END_SOUND_FREQUENCY_HZ;
    gain.gain.value = END_SOUND_GAIN;
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + END_SOUND_DURATION_MS / MS_PER_SECOND);
  }, [muted]);

  return {
    muted,
    prime,
    play,
    toggleMuted: () => {
      setMuted((current) => !current);
    },
  };
}

export type EndSound = ReturnType<typeof useEndSound>;
