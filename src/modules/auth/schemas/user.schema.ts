import { z } from 'zod';

// Recurso User de TaskApiSDD (API-002 «Recurso User»)
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;
