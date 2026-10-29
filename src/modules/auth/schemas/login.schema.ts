import { z } from 'zod';

import { emailFormat, requiredEmail, requiredPassword } from './auth-fields.schema';

// Inicio de sesión: solo obligatorios y formato del email (S-12)
export const loginSchema = z.object({
  email: requiredEmail.pipe(emailFormat),
  password: requiredPassword,
});

export type LoginValues = z.infer<typeof loginSchema>;
