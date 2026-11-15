import { z } from 'zod';

// Recurso User de TaskApiSDD (API-002 «Recurso User»)
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

// Sesión que devuelven GET /me y el inicio de sesión (API-003 RF-01): la cuenta y el token CSRF de la sesión
export const sessionSchema = z.object({
  user: userSchema,
  csrfToken: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;
