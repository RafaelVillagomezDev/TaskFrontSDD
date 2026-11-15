import { z } from 'zod';

import { pageSchema } from '@shared/api/api-envelope.schema';
import { isDayKey } from '@shared/date/day.util';

// Recurso PomodoroTask de TaskApiSDD (API-004 «Recurso PomodoroTask»)
export const pomodoroTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  date: z.string().refine(isDayKey),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
});

export type PomodoroTask = z.infer<typeof pomodoroTaskSchema>;

// Recurso Pomodoro (API-004 «Recurso Pomodoro»): las tareas son el estado actual mientras la sesión está activa
// y la foto del instante de fin cuando está terminada (API-004 RF-16, RF-58)
export const pomodoroSchema = z.object({
  id: z.string(),
  durationMinutes: z.number().int().positive(),
  // Estados de una sesión (API-004 RF-14): z.enum infiere la unión de literales, sin enum de TypeScript
  status: z.enum(['running', 'paused', 'finished']),
  startedAt: z.string(),
  endsAt: z.string().nullable(),
  remainingSeconds: z.number().int().nonnegative(),
  finishedAt: z.string().nullable(),
  focusedSeconds: z.number().int().nonnegative().nullable(),
  // Motivo de fin (API-004 RF-33): por tiempo o a mano
  endReason: z.enum(['time', 'manual']).nullable(),
  tasks: z.array(pomodoroTaskSchema),
  completedTasks: z.number().int().nonnegative(),
  totalTasks: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type Pomodoro = z.infer<typeof pomodoroSchema>;
export type PomodoroStatus = Pomodoro['status'];

export const pomodoroPageSchema = pageSchema(pomodoroSchema);
export const pomodoroTaskPageSchema = pageSchema(pomodoroTaskSchema);

// Recurso Achievement (API-004 «Recurso Achievement»): target y progress en sesiones, días, tareas o, en FOCUS_10H,
// minutos de concentración (API-004 RF-65)
export const achievementSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  target: z.number().int().positive(),
  progress: z.number().int().nonnegative(),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
});

export type Achievement = z.infer<typeof achievementSchema>;

export const achievementListSchema = z.array(achievementSchema);
