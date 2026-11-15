import type { z } from 'zod';

import { createTaskFormSchema } from '@modules/tasks';

// Editar una tarea del pomodoro (RF-35, RF-36): título y descripción con las reglas de la 001; la fecha no se puede
// cambiar (API-004 RF-54). El día no influye en estas dos reglas
export function createEditPomodoroTaskSchema(today: string) {
  return createTaskFormSchema(today).pick({ title: true, description: true });
}

export type EditPomodoroTaskValues = z.infer<ReturnType<typeof createEditPomodoroTaskSchema>>;
