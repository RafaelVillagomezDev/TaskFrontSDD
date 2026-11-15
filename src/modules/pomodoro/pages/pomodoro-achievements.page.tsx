import { StreakStats } from '@modules/streaks';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Spinner } from '@shared/ui/spinner.component';
import { Text } from '@shared/ui/text.component';
import { AchievementCard } from '../components/achievement-card.component';
import { usePomodoroAchievements, type PomodoroAchievements } from '../hooks/use-pomodoro-achievements.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

const { achievements: texts } = POMODORO_TEXTS;

type Model = Readonly<{ model: PomodoroAchievements }>;

// Racha del pomodoro con la misma presentación que la del tablero y separada de ella (RF-41, plan D-10). Un fallo
// solo afecta a esta zona, con su reintento (RF-67)
function StreakSection({ model }: Model) {
  const { streak } = model;
  return (
    <section aria-label={texts.streak} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <Text as="h2" variant="h4">
          {texts.streak}
        </Text>
        <Text variant="body-sm" tone="muted">
          {texts.streakHelp}
        </Text>
      </div>
      {streak.status === 'error' ? (
        <ErrorMessage message={streak.errorMessage ?? ''} onRetry={streak.retry} />
      ) : (
        <dl className="grid grid-cols-2 gap-4 md:flex md:flex-wrap md:gap-x-12">
          <StreakStats streak={streak.value} />
        </dl>
      )}
    </section>
  );
}

function AchievementsContent({ model }: Model) {
  const { achievements } = model;
  if (achievements.status === 'loading') return <Spinner />;
  if (achievements.status === 'error') {
    return <ErrorMessage message={achievements.errorMessage ?? ''} onRetry={achievements.retry} />;
  }
  return (
    <ul aria-label={texts.list} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {achievements.items.map((achievement) => (
        <AchievementCard key={achievement.code} achievement={achievement} />
      ))}
    </ul>
  );
}

// Racha y logros del pomodoro en /pomodoro/achievements (RF-41 a RF-44, RF-53, RF-67)
export function PomodoroAchievementsPage() {
  const model = usePomodoroAchievements();
  return (
    <div className="flex flex-col gap-6">
      <StreakSection model={model} />
      <section aria-label={texts.region} className="flex flex-col gap-4">
        <Text as="h2" variant="h4">
          {texts.title}
        </Text>
        <AchievementsContent model={model} />
      </section>
    </div>
  );
}
