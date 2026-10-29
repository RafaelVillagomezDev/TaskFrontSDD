import { z } from 'zod';

import { REASON_EXPIRED } from '../../../shared/router/routes.constants';

// Estado de navegación que deja el registro al llevar al inicio de sesión (RF-01). Se valida: llega como unknown
const registeredStateSchema = z.object({ registered: z.literal(true), email: z.string() });

export type RegisteredState = z.infer<typeof registeredStateSchema>;

export type LoginNotice = 'registered' | 'expired' | null;

interface LoginEntry {
  email: string;
  notice: LoginNotice;
}

// Email ya escrito y aviso con el que se abre el inicio de sesión: cuenta creada (RF-01) o sesión caducada (RF-07)
export function loginEntry(state: unknown, reason: string | null): LoginEntry {
  const registered = registeredStateSchema.safeParse(state);
  if (registered.success) return { email: registered.data.email, notice: 'registered' };
  return { email: '', notice: reason === REASON_EXPIRED ? 'expired' : null };
}
