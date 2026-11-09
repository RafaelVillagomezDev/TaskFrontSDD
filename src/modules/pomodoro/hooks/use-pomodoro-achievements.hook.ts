import { errorMessage, toApiError } from '@shared/api/api-error.util';
import { formatDateTime } from '@shared/date/date-format.util';
import { useGetPomodoroAchievementsQuery, useGetPomodoroStreakQuery } from '../api/pomodoro.api';
import type { Achievement } from '../schemas/pomodoro.schema';
import { minutesDuration, POMODORO_TEXTS } from '../texts/pomodoro.texts';

export type AchievementsStatus = 'loading' | 'error' | 'ready';

// Logro listo para mostrar (RF-42 a RF-44): el progreso sobre la meta en texto y, si está conseguido, su fecha
export interface AchievementView {
  code: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  unlocked: boolean;
  progressLabel: string;
  unlockedLabel: string | undefined;
}

// Logro con meta en minutos de concentración (API-004 RF-65): se muestra en horas y minutos (RF-44)
const FOCUS_CODE = 'FOCUS_10H';

// Entrada de caché de «Logros» (plan D-11); se vuelve a pedir al abrir la vista para no enseñar logros antiguos
const CURRENT_REF = 'current';

const { achievements: texts } = POMODORO_TEXTS;

const NO_ACHIEVEMENTS: AchievementView[] = [];

function progressLabel({ code, progress, target }: Achievement): string {
  if (code === FOCUS_CODE) return texts.count(minutesDuration(progress), minutesDuration(target));
  return texts.count(String(progress), String(target));
}

function toView(achievement: Achievement): AchievementView {
  return {
    code: achievement.code,
    name: achievement.name,
    description: achievement.description,
    progress: achievement.progress,
    target: achievement.target,
    unlocked: achievement.unlocked,
    progressLabel: progressLabel(achievement),
    unlockedLabel:
      achievement.unlocked && achievement.unlockedAt !== null
        ? texts.unlockedOn(formatDateTime(achievement.unlockedAt))
        : undefined,
  };
}

function statusOf(hasData: boolean, isError: boolean): AchievementsStatus {
  if (hasData) return 'ready';
  return isError ? 'error' : 'loading';
}

function retryOf(refetch: () => Promise<unknown>) {
  return () => {
    void (async () => {
      await refetch();
    })();
  };
}

// Racha y logros del pomodoro en /pomodoro/achievements (RF-41 a RF-44, RF-67): dos consultas independientes, así que
// un fallo de la racha muestra su error y su reintento sin ocultar los logros
export function usePomodoroAchievements() {
  const streak = useGetPomodoroStreakQuery(undefined, { refetchOnMountOrArgChange: true });
  const achievements = useGetPomodoroAchievementsQuery(CURRENT_REF, { refetchOnMountOrArgChange: true });
  const streakStatus = statusOf(streak.data !== undefined, streak.isError);
  const achievementsStatus = statusOf(achievements.data !== undefined, achievements.isError);

  return {
    streak: {
      status: streakStatus,
      value: streak.data,
      errorMessage: streakStatus === 'error' ? errorMessage(toApiError(streak.error).code) : undefined,
      retry: retryOf(streak.refetch),
    },
    achievements: {
      status: achievementsStatus,
      items: achievements.data?.map(toView) ?? NO_ACHIEVEMENTS,
      errorMessage: achievementsStatus === 'error' ? errorMessage(toApiError(achievements.error).code) : undefined,
      retry: retryOf(achievements.refetch),
    },
  };
}

export type PomodoroAchievements = ReturnType<typeof usePomodoroAchievements>;
