import { z } from 'zod';

import { AUTH_TEXTS } from '../texts/auth.texts';
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './auth.constants';
import { emailFormat, requiredEmail, requiredPassword } from './auth-fields.schema';

const { validation } = AUTH_TEXTS;

// Registro con las reglas de RF-46, las mismas que la API (API-002 RF-02 a RF-05)
export const registerSchema = z.object({
  email: requiredEmail.max(EMAIL_MAX_LENGTH, validation.emailTooLong).pipe(emailFormat),
  password: requiredPassword
    .min(PASSWORD_MIN_LENGTH, validation.password.tooShort)
    .max(PASSWORD_MAX_LENGTH, validation.password.tooLong),
  name: z.string().trim().max(NAME_MAX_LENGTH, validation.nameTooLong).optional(),
});

export type RegisterValues = z.infer<typeof registerSchema>;
