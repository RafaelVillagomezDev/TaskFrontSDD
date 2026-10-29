import { z } from 'zod';

import { AUTH_TEXTS } from '../texts/auth.texts';

const { validation } = AUTH_TEXTS;

// Email recortado y obligatorio (RF-46). El formato se valida con pipe solo si lo anterior pasa,
// así cada campo muestra un único error: primero el más útil
export const requiredEmail = z.string().trim().min(1, validation.emailRequired);

export const emailFormat = z.email(validation.emailInvalid);

// Contraseña obligatoria; nunca se recorta (RF-46)
export const requiredPassword = z.string().min(1, validation.password.required);
