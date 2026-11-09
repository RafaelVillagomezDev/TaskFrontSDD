import { achievementSchema, pomodoroPageSchema, pomodoroSchema, pomodoroTaskSchema } from '../pomodoro.schema';

const TASK = {
  id: 'b3f1c2e4-0000-4000-8000-000000000001',
  title: 'Repasar el tema 3',
  description: null,
  date: '2026-11-09',
  completed: false,
  completedAt: null,
};

const RUNNING = {
  id: 'p-1',
  durationMinutes: 25,
  status: 'running',
  startedAt: '2026-11-09T09:00:00Z',
  endsAt: '2026-11-09T09:25:00Z',
  remainingSeconds: 1500,
  finishedAt: null,
  focusedSeconds: null,
  endReason: null,
  tasks: [TASK],
  completedTasks: 0,
  totalTasks: 1,
  createdAt: '2026-11-09T09:00:00Z',
};

const PAUSED = { ...RUNNING, status: 'paused', endsAt: null, remainingSeconds: 900 };

const FINISHED = {
  ...RUNNING,
  status: 'finished',
  endsAt: null,
  remainingSeconds: 0,
  finishedAt: '2026-11-09T09:25:00Z',
  focusedSeconds: 1500,
  endReason: 'time',
  tasks: [{ ...TASK, completed: true, completedAt: '2026-11-09T09:10:00Z' }],
  completedTasks: 1,
};

describe('pomodoroTaskSchema (recurso PomodoroTask de API-004)', () => {
  it('acepta una tarea pendiente y una completada con su instante', () => {
    expect(pomodoroTaskSchema.parse(TASK)).toEqual(TASK);
    expect(pomodoroTaskSchema.parse({ ...TASK, completed: true, completedAt: '2026-11-09T09:10:00Z' }).completed).toBe(
      true,
    );
  });

  it.each([
    ['sin título', { title: undefined }],
    ['con una fecha que no es AAAA-MM-DD', { date: '09/11/2026' }],
    ['sin completedAt', { completedAt: undefined }],
  ])('rechaza una tarea %s', (_case, change) => {
    expect(pomodoroTaskSchema.safeParse({ ...TASK, ...change }).success).toBe(false);
  });
});

describe('pomodoroSchema (recurso Pomodoro de API-004)', () => {
  it.each([
    ['en curso', RUNNING],
    ['pausada, sin fin previsto', PAUSED],
    ['terminada, con su foto, concentración y motivo', FINISHED],
  ])('acepta una sesión %s', (_case, session) => {
    expect(pomodoroSchema.parse(session)).toEqual(session);
  });

  it('acepta una sesión terminada a mano', () => {
    expect(pomodoroSchema.parse({ ...FINISHED, endReason: 'manual' }).endReason).toBe('manual');
  });

  it.each([
    ['con un estado desconocido', { status: 'cancelled' }],
    ['con un motivo de fin desconocido', { ...FINISHED, endReason: 'timeout' }],
    ['con remainingSeconds negativo', { remainingSeconds: -1 }],
    ['sin tareas', { tasks: undefined }],
  ])('rechaza una sesión %s', (_case, change) => {
    expect(pomodoroSchema.safeParse({ ...RUNNING, ...change }).success).toBe(false);
  });

  it('valida la página de GET /pomodoros', () => {
    const page = { items: [RUNNING, FINISHED], page: 1, pageSize: 20, totalItems: 2, totalPages: 1 };
    expect(pomodoroPageSchema.parse(page).items).toHaveLength(2);
  });
});

describe('achievementSchema (recurso Achievement de API-004)', () => {
  const ACHIEVEMENT = {
    code: 'SESSIONS_10',
    name: 'Concentrado',
    description: 'Termina por tiempo 10 sesiones pomodoro.',
    target: 10,
    progress: 7,
    unlocked: false,
    unlockedAt: null,
  };

  it('acepta un logro sin conseguir y uno conseguido con su instante', () => {
    expect(achievementSchema.parse(ACHIEVEMENT)).toEqual(ACHIEVEMENT);
    const unlocked = { ...ACHIEVEMENT, progress: 10, unlocked: true, unlockedAt: '2026-11-09T09:25:00Z' };
    expect(achievementSchema.parse(unlocked).unlocked).toBe(true);
  });

  it('rechaza un progreso negativo', () => {
    expect(achievementSchema.safeParse({ ...ACHIEVEMENT, progress: -1 }).success).toBe(false);
  });
});
