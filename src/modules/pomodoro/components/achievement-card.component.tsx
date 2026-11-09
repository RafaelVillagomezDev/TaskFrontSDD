import { cn } from '@shared/utils/class-names.util';
import { Badge } from '@shared/ui/badge.component';
import { Text } from '@shared/ui/text.component';
import type { AchievementView } from '../hooks/use-pomodoro-achievements.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface AchievementCardProps {
  achievement: AchievementView;
}

const { achievements: texts } = POMODORO_TEXTS;

// Un logro (RF-42 a RF-44): nombre, descripción y progreso sobre la meta con una barra nativa con nombre accesible.
// Plano, con borde y sin sombra (DESIGN.md); el color solo marca el estado: la barra pasa a Leaf al conseguirlo y
// aparece la insignia «Conseguido» con la fecha
export function AchievementCard({ achievement }: Readonly<AchievementCardProps>) {
  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-md border bg-surface p-4',
        achievement.unlocked ? 'border-success' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Text as="h3" variant="body" className="min-w-0 font-semibold break-words">
          {achievement.name}
        </Text>
        {achievement.unlocked && <Badge variant="success">{texts.unlocked}</Badge>}
      </div>
      <Text variant="body-sm" tone="muted" className="break-words">
        {achievement.description}
      </Text>
      <div className="flex flex-col gap-1">
        <progress
          value={achievement.progress}
          max={achievement.target}
          aria-label={texts.progress(achievement.name)}
          className={cn('h-2 w-full', achievement.unlocked ? 'accent-success' : 'accent-primary')}
        />
        <Text variant="caption" tone="muted" className="tabular-nums">
          {achievement.progressLabel}
        </Text>
      </div>
      {achievement.unlockedLabel !== undefined && (
        <Text variant="caption" tone="muted">
          {achievement.unlockedLabel}
        </Text>
      )}
    </li>
  );
}
