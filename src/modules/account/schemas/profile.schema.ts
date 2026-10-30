import { z } from 'zod';

import { ACCOUNT_TEXTS } from '../texts/account.texts';
import { PROFILE_NAME_MAX_LENGTH } from './account.constants';

// Perfil con las reglas de RF-46 (API-002 RF-05): solo el nombre, opcional y de como mucho 100 caracteres
// sin los espacios de los extremos
export const profileSchema = z.object({
  name: z.string().trim().max(PROFILE_NAME_MAX_LENGTH, ACCOUNT_TEXTS.validation.nameTooLong),
});

export type ProfileValues = z.infer<typeof profileSchema>;
