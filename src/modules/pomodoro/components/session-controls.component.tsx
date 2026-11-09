import { Pause, Play, Square, Volume2, VolumeX } from 'lucide-react';

import { Button } from '@shared/ui/button.component';
import { Icon } from '@shared/ui/icon.component';
import type { EndSound } from '../hooks/use-end-sound.hook';
import type { SessionActions } from '../hooks/use-session-actions.hook';
import type { Pomodoro } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface SessionControlsProps {
  session: Pomodoro;
  actions: SessionActions;
  sound: EndSound;
}

const { session: texts } = POMODORO_TEXTS;

// Controles de la sesión activa (RF-23 a RF-25, RF-61): «Pausar» o «Reanudar» según el estado, «Terminar» (pide
// confirmación) y el silencio del aviso de fin, un botón con aria-pressed. Ocupan el ancho en móvil
export function SessionControls({ session, actions, sound }: Readonly<SessionControlsProps>) {
  const paused = session.status === 'paused';
  return (
    <fieldset aria-label={texts.controls} className="flex min-w-0 flex-wrap items-center justify-center gap-3">
      <Button
        disabled={actions.isChangingStatus}
        onClick={() => {
          void (paused ? actions.resume() : actions.pause());
        }}
        className="flex-1 sm:flex-none"
      >
        <Icon icon={paused ? Play : Pause} />
        {paused ? texts.resume : texts.pause}
      </Button>
      <Button
        variant="secondary"
        disabled={actions.isChangingStatus}
        onClick={actions.requestFinish}
        className="flex-1 sm:flex-none"
      >
        <Icon icon={Square} />
        {texts.finish}
      </Button>
      <Button variant="ghost" aria-label={texts.mute} aria-pressed={sound.muted} onClick={sound.toggleMuted}>
        <Icon icon={sound.muted ? VolumeX : Volume2} />
      </Button>
    </fieldset>
  );
}
