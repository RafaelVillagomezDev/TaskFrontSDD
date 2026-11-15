import { z } from 'zod';

import { POMODORO_TEXTS } from '../texts/pomodoro.texts';
import { MAX_SESSION_TASKS } from './pomodoro.constants';
import { createSessionTasksSchema } from './start-session.schema';

const { validation } = POMODORO_TEXTS;

// Formulario de añadir tareas a la sesión activa (RF-29, API-004 RF-51): las mismas reglas que al empezar (RF-08 a
// RF-11), al menos una tarea entre nuevas y en espera, y la sesión no puede pasar de 20 con las que ya tiene. Lleva
// la duración del formulario de empezar sin validarla: los dos comparten SessionFormValues
export function createAddTasksSchema(today: string, existingTasks: number) {
  return createSessionTasksSchema(today)
    .extend({ duration: z.string(), customMinutes: z.string() })
    .superRefine((values, context) => {
      const adding = values.newTasks.length + values.waitingTaskIds.length;
      if (adding === 0) context.addIssue({ code: 'custom', path: ['newTasks'], message: validation.atLeastOneTask });
      if (existingTasks + adding > MAX_SESSION_TASKS) {
        context.addIssue({ code: 'custom', path: ['newTasks'], message: validation.tooManyTasks });
      }
    });
}
