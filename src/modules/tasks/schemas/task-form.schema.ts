import { z } from 'zod';

import { compareDays, isDayKey } from '../../../shared/date/day.util';
import { TASKS_TEXTS } from '../texts/tasks.texts';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from './tasks.constants';

const { validation } = TASKS_TEXTS;

// Formulario de crear tarea con las reglas de RF-46, las mismas que la API (API-001 RF-04 a RF-06).
// La fecha depende del día actual (RF-16); pipe muestra un único error por campo: obligatoria → válida → no pasada
export function createTaskFormSchema(today: string) {
  return z.object({
    title: z.string().trim().min(1, validation.titleRequired).max(TITLE_MAX_LENGTH, validation.titleTooLong),
    description: z.string().trim().max(DESCRIPTION_MAX_LENGTH, validation.descriptionTooLong),
    date: z
      .string()
      .min(1, validation.dateRequired)
      .pipe(z.string().refine(isDayKey, validation.dateInvalid))
      .pipe(z.string().refine((day) => compareDays(day, today) >= 0, validation.datePast)),
  });
}

export type TaskFormValues = z.infer<ReturnType<typeof createTaskFormSchema>>;

// Formulario de editar (RF-29): mismas reglas para título y descripción; la fecha no se puede cambiar
// (API-001 RF-37), así que viaja sin validar y nunca se envía
export function editTaskFormSchema(today: string) {
  return createTaskFormSchema(today).extend({ date: z.string() });
}
