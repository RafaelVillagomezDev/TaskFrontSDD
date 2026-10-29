import { z } from 'zod';

import { pageSchema } from '../../../shared/api/api-envelope.schema';
import { isDayKey } from '../../../shared/date/day.util';

// Recurso Task de TaskApiSDD (API-001 «Recurso Task»)
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  // Día de calendario AAAA-MM-DD (plan §4, DayKey)
  date: z.string().refine(isDayKey),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

export const taskPageSchema = pageSchema(taskSchema);
