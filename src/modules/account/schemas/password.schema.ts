import { z } from 'zod';

import { ACCOUNT_TEXTS } from '../texts/account.texts';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './account.constants';

const { password: messages } = ACCOUNT_TEXTS.validation;

// Cambiar contraseña con las reglas de RF-46 (API-002 RF-04, RF-28): la actual, obligatoria; la nueva, de 12 a 128
// caracteres. Nunca se recortan. pipe da un único error por campo: obligatoria → longitud
export const passwordSchema = z.object({
  currentPassword: z.string().min(1, messages.currentRequired),
  newPassword: z
    .string()
    .min(1, messages.nextRequired)
    .pipe(z.string().min(PASSWORD_MIN_LENGTH, messages.tooShort).max(PASSWORD_MAX_LENGTH, messages.tooLong)),
});

export type PasswordValues = z.infer<typeof passwordSchema>;
