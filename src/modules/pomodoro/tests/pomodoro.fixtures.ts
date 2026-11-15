import { apiOk } from '@test-utils/mock-api';
import type { Achievement, Pomodoro, PomodoroTask } from '../schemas/pomodoro.schema';

// Datos de prueba del pomodoro con la forma de API-004, para los tests de hooks, componentes y páginas

export function pomodoroTaskFixture(overrides: Partial<PomodoroTask> = {}): PomodoroTask {
  return {
    id: 't-1',
    title: 'Repasar el tema 3',
    description: null,
    date: '2026-11-09',
    completed: false,
    completedAt: null,
    ...overrides,
  };
}

export function pomodoroFixture(overrides: Partial<Pomodoro> = {}): Pomodoro {
  const status = overrides.status ?? 'running';
  const finished = status === 'finished';
  const tasks = overrides.tasks ?? [pomodoroTaskFixture()];
  return {
    id: 'p-1',
    durationMinutes: 25,
    status,
    startedAt: '2026-11-09T09:00:00Z',
    endsAt: status === 'running' ? '2026-11-09T09:25:00Z' : null,
    remainingSeconds: finished ? 0 : 1500,
    finishedAt: finished ? '2026-11-09T09:25:00Z' : null,
    focusedSeconds: finished ? 1500 : null,
    endReason: finished ? 'time' : null,
    tasks,
    completedTasks: tasks.filter((task) => task.completed).length,
    totalTasks: tasks.length,
    createdAt: '2026-11-09T09:00:00Z',
    ...overrides,
  };
}

export function pomodoroPage(items: unknown[]) {
  return apiOk({ items, page: 1, pageSize: 20, totalItems: items.length, totalPages: items.length === 0 ? 0 : 1 });
}

export function achievementFixture(overrides: Partial<Achievement> = {}): Achievement {
  return {
    code: 'FIRST_POMODORO',
    name: 'Primer pomodoro',
    description: 'Termina tu primera sesión por tiempo.',
    target: 1,
    progress: 0,
    unlocked: false,
    unlockedAt: null,
    ...overrides,
  };
}

// Los 11 logros del catálogo de API-004 RF-43, sin conseguir, en su orden
export const ACHIEVEMENT_CODES: readonly string[] = [
  'FIRST_POMODORO',
  'SESSIONS_10',
  'SESSIONS_50',
  'SESSIONS_100',
  'STREAK_3',
  'STREAK_7',
  'STREAK_30',
  'MARATHON',
  'TASKS_10',
  'TASKS_100',
  'FOCUS_10H',
];

export function catalogFixture(): Achievement[] {
  return ACHIEVEMENT_CODES.map((code) => achievementFixture({ code, name: `Logro ${code}` }));
}
