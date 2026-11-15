import { z } from 'zod';

import { ACCOUNT_TEXTS } from '../texts/account.texts';

// Borrar la cuenta pide la contraseña (RF-46, RF-49): sin ella no se puede confirmar. Nunca se recorta
export const deleteAccountSchema = z.object({
  password: z.string().min(1, ACCOUNT_TEXTS.validation.password.confirmRequired),
});

export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
