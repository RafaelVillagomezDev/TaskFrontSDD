import { Flame, Trophy } from 'lucide-react';

import { Spinner } from '@shared/ui/spinner.component';
import type { Streak } from '../schemas/streak.schema';
import { STREAKS_TEXTS } from '../texts/streaks.texts';
import { StreakStat } from './streak-stat.component';

interface StreakStatsProps {
  // undefined mientras se carga
  streak: Streak | undefined;
}

function StreakDays({ days }: Readonly<{ days: number | undefined }>) {
  return days === undefined ? <Spinner /> : STREAKS_TEXTS.panel.days(days);
}

// Racha actual y mejor racha (001 RF-25, 003 RF-41, 003 plan D-10): presentación pura a partir de { current, best },
// compartida por el tablero y el pomodoro. Son dos parejas dt/dd: van dentro del <dl> de quien las usa, junto a
// otros datos si los hay (el progreso de hoy en el tablero)
export function StreakStats({ streak }: Readonly<StreakStatsProps>) {
  return (
    <>
      <StreakStat icon={Flame} label={STREAKS_TEXTS.panel.current}>
        <StreakDays days={streak?.current} />
      </StreakStat>
      <StreakStat icon={Trophy} label={STREAKS_TEXTS.panel.best}>
        <StreakDays days={streak?.best} />
      </StreakStat>
    </>
  );
}
