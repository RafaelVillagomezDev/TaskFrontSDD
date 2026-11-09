import { apiOk } from '@test-utils/mock-api';
import type { Pomodoro, PomodoroTask } from '../schemas/pomodoro.schema';

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
