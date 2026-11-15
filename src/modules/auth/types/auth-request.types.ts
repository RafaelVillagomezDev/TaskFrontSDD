import type { LoginValues } from '../schemas/login.schema';
import type { RegisterValues } from '../schemas/register.schema';

// Cuerpos de POST /auth/login y POST /auth/register: los valores del formulario más el token de Turnstile, que
// no forma parte del formulario (API-005 RF-01; spec 005 RF-07, plan D-5)
export type LoginRequest = LoginValues & { turnstileToken: string };
export type RegisterRequest = RegisterValues & { turnstileToken: string };
