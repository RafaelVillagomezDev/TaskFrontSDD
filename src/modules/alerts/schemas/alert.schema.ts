import { z } from 'zod';

import { pageSchema } from '../../../shared/api/api-envelope.schema';
import { isDayKey } from '../../../shared/date/day.util';

const dayKey = z.string().refine(isDayKey);

// Tipo de aviso (API-001 RF-24 a RF-26)
export const alertTypeSchema = z.enum(['daily', 'weekly', 'monthly']);

export type AlertType = z.infer<typeof alertTypeSchema>;

// Copia de una tarea en el momento del aviso, no su estado actual (API-001 RF-30)
export const alertTaskSchema = z.object({ id: z.string(), title: z.string(), date: dayKey });

export type AlertTask = z.infer<typeof alertTaskSchema>;

// Recurso Alert de GET /alerts: periodo del día, la semana o el mes, y fecha de generación en ISO 8601
export const alertSchema = z.object({
  id: z.string(),
  type: alertTypeSchema,
  periodStart: dayKey,
  periodEnd: dayKey,
  tasks: z.array(alertTaskSchema),
  createdAt: z.iso.datetime({ offset: true }),
});

export type Alert = z.infer<typeof alertSchema>;

export const alertPageSchema = pageSchema(alertSchema);
