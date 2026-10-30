import { z } from 'zod';

// Racha de GET /streak (API-001 RF-17 a RF-21): días seguidos con al menos una tarea completada
export const streakSchema = z.object({
  current: z.number().int().nonnegative(),
  best: z.number().int().nonnegative(),
});

export type Streak = z.infer<typeof streakSchema>;
