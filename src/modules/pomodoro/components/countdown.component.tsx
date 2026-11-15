import { Text } from '@shared/ui/text.component';
import { cn } from '@shared/utils/class-names.util';
import { formatClock } from '../hooks/use-countdown.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface CountdownProps {
  seconds: number;
  paused: boolean;
}

const { session: texts } = POMODORO_TEXTS;

// Cuenta atrás «MM:SS» (RF-15, RF-16): cifras de ancho fijo para que no baile al cambiar y sin animación, porque
// cambia cada segundo (emil-design-eng: lo frecuente no se anima). No es una región viva: el lector la lee al
// llegar a ella y los hitos se anuncian aparte (RNF-02). En pausa se atenúa
export function Countdown({ seconds, paused }: Readonly<CountdownProps>) {
  return (
    <Text
      as="p"
      variant="display"
      className={cn('text-center font-semibold tabular-nums', paused && 'text-foreground-muted')}
    >
      <span className="sr-only">{texts.timeLeft}: </span>
      {formatClock(seconds)}
    </Text>
  );
}
