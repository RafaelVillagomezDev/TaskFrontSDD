import { z } from 'zod';

import { createTaskFormSchema } from '@modules/tasks';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';
import { DURATION_PRESETS, MAX_DURATION, MAX_SESSION_TASKS, MIN_DURATION } from './pomodoro.constants';

const { validation } = POMODORO_TEXTS;

// Opción «Otra» del selector de duración (RF-55)
export const CUSTOM_DURATION = 'custom';

const DURATION_OPTIONS: readonly string[] = [...DURATION_PRESETS.map(String), CUSTOM_DURATION];

const INTEGER_PATTERN = /^\d+$/;

// Minutos de «Otra»: un solo error por campo, en orden (obligatorio → entero → intervalo), como los campos de la 001
function customMinutesError(raw: string): string | undefined {
  const value = raw.trim();
  if (value === '') return validation.minutesRequired;
  if (!INTEGER_PATTERN.test(value)) return validation.minutesInteger;
  const minutes = Number(value);
  return minutes < MIN_DURATION || minutes > MAX_DURATION ? validation.minutesRange : undefined;
}

// Lista de tareas nuevas y en espera, compartida por empezar una sesión y añadir tareas a la activa (RF-08 a RF-13)
export function createSessionTasksSchema(today: string) {
  return z.object({
    // Mismas reglas que una tarea de la 001 (API-004 RF-06, plan D-9)
    newTasks: z.array(createTaskFormSchema(today)),
    waitingTaskIds: z.array(z.string()),
  });
}

// Formulario de empezar una sesión (RF-06 a RF-13, RF-55, RF-56). La duración es una de las fijas u «Otra»; el
// campo de minutos solo se valida con «Otra». El total de tareas se comprueba sobre las dos listas (RF-13)
export function createStartSessionSchema(today: string) {
  return createSessionTasksSchema(today)
    .extend({
      duration: z.string().refine((value) => DURATION_OPTIONS.includes(value), validation.durationRequired),
      customMinutes: z.string(),
    })
    .superRefine((values, context) => {
      if (values.duration === CUSTOM_DURATION) {
        const message = customMinutesError(values.customMinutes);
        if (message !== undefined) context.addIssue({ code: 'custom', path: ['customMinutes'], message });
      }
      if (values.newTasks.length + values.waitingTaskIds.length > MAX_SESSION_TASKS) {
        context.addIssue({ code: 'custom', path: ['newTasks'], message: validation.tooManyTasks });
      }
    });
}

// Valores de los dos formularios con lista de tareas (empezar y añadir): el de añadir lleva la duración sin usarla
export type SessionFormValues = z.infer<ReturnType<typeof createStartSessionSchema>>;

// Duración en minutos que se envía a la API (RF-56): la del campo con «Otra», la fija en otro caso
export function durationMinutesOf({ duration, customMinutes }: SessionFormValues): number {
  return Number(duration === CUSTOM_DURATION ? customMinutes.trim() : duration);
}
