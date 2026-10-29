import { request } from '@playwright/test';
import { z } from 'zod';

const csrfResponseSchema = z.object({ data: z.object({ csrfToken: z.string() }) });

const HTTP_CREATED = 201;
const HTTP_CONFLICT = 409;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable ${name} en .env.dev (README.md, «Variables de entorno»)`);
  }
  return value;
}

// Registra el usuario de prueba dedicado si aún no existe; un 409 significa que ya está creado (plan R-8)
export default async function globalSetup(): Promise<void> {
  const email = requireEnv('E2E_USER_EMAIL');
  const password = requireEnv('E2E_USER_PASSWORD');
  const api = await request.newContext({ baseURL: requireEnv('VITE_API_URL') });

  try {
    const csrfResponse = await api.get('/auth/csrf');
    const { data } = csrfResponseSchema.parse(await csrfResponse.json());
    const registerResponse = await api.post('/auth/register', {
      headers: { 'X-CSRF-Token': data.csrfToken },
      data: { email, password },
    });
    if (registerResponse.status() !== HTTP_CREATED && registerResponse.status() !== HTTP_CONFLICT) {
      throw new Error(`No se pudo registrar el usuario de prueba: HTTP ${String(registerResponse.status())}`);
    }
  } finally {
    await api.dispose();
  }
}
