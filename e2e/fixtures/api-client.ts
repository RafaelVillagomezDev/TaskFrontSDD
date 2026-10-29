import { request, type APIRequestContext } from '@playwright/test';
import { z } from 'zod';

import { buildClientTimeHeaders } from '../../src/shared/api/client-time.util';

const csrfResponseSchema = z.object({ data: z.object({ csrfToken: z.string() }) });

const HTTP_OK = 200;
const HTTP_CREATED = 201;
const HTTP_UNAUTHORIZED = 401;

export interface Account {
  email: string;
  password: string;
}

export interface NewTask {
  title: string;
  // Día AAAA-MM-DD del dispositivo
  date: string;
  completed?: boolean;
}

const taskResponseSchema = z.object({ data: z.object({ id: z.string() }) });

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable ${name} en .env.dev (README.md, «Variables de entorno»)`);
  }
  return value;
}

// Cuenta nueva y única para un test: así cada test crea y borra sus propios datos (CONSTITUTION.md IV.5)
export function uniqueAccount(): Account {
  return { email: `e2e-${crypto.randomUUID()}@kompitu.test`, password: `clave-e2e-${crypto.randomUUID()}` };
}

async function withApi<T>(work: (api: APIRequestContext) => Promise<T>): Promise<T> {
  const api = await request.newContext({ baseURL: requireEnv('VITE_API_URL') });
  try {
    return await work(api);
  } finally {
    await api.dispose();
  }
}

async function csrfToken(api: APIRequestContext): Promise<string> {
  const response = await api.get('/auth/csrf');
  return csrfResponseSchema.parse(await response.json()).data.csrfToken;
}

// Inicia sesión por API y devuelve el token CSRF de la sesión
async function loginByApi(api: APIRequestContext, account: Account): Promise<string> {
  const login = await api.post('/auth/login', {
    headers: { 'X-CSRF-Token': await csrfToken(api) },
    data: account,
  });
  if (login.status() !== HTTP_OK) {
    throw new Error(`No se pudo iniciar sesión con ${account.email}: HTTP ${String(login.status())}`);
  }
  return csrfResponseSchema.parse(await login.json()).data.csrfToken;
}

function expectStatus(response: { status: () => number }, expected: number, action: string): void {
  if (response.status() !== expected) {
    throw new Error(`No se pudo ${action}: HTTP ${String(response.status())}`);
  }
}

// Crea las tareas de un test por API, en orden (y completa las marcadas); se borran al borrar la cuenta
export async function createTasks(account: Account, tasks: NewTask[]): Promise<void> {
  await withApi(async (api) => {
    const session = await loginByApi(api, account);
    for (const task of tasks) {
      const headers = { 'X-CSRF-Token': session, ...buildClientTimeHeaders() };
      const created = await api.post('/tasks', { headers, data: { title: task.title, date: task.date } });
      expectStatus(created, HTTP_CREATED, `crear la tarea «${task.title}»`);
      if (task.completed !== true) continue;
      const { id } = taskResponseSchema.parse(await created.json()).data;
      const completed = await api.patch(`/tasks/${id}`, { headers, data: { completed: true } });
      expectStatus(completed, HTTP_OK, `completar la tarea «${task.title}»`);
    }
  });
}

export async function registerAccount(account: Account): Promise<void> {
  await withApi(async (api) => {
    const response = await api.post('/auth/register', {
      headers: { 'X-CSRF-Token': await csrfToken(api) },
      data: account,
    });
    if (response.status() !== HTTP_CREATED) {
      throw new Error(`No se pudo registrar la cuenta de prueba: HTTP ${String(response.status())}`);
    }
  });
}

// Borra la cuenta (y con ella sus datos) iniciando sesión por API; si no llegó a crearse, no hay nada que borrar
export async function deleteAccount(account: Account): Promise<void> {
  await withApi(async (api) => {
    const login = await api.post('/auth/login', {
      headers: { 'X-CSRF-Token': await csrfToken(api) },
      data: account,
    });
    if (login.status() === HTTP_UNAUTHORIZED) return;
    const session = csrfResponseSchema.parse(await login.json()).data.csrfToken;
    const deletion = await api.delete('/me', {
      headers: { 'X-CSRF-Token': session },
      data: { password: account.password },
    });
    if (deletion.status() !== HTTP_OK) {
      throw new Error(`No se pudo borrar la cuenta de prueba ${account.email}: HTTP ${String(deletion.status())}`);
    }
  });
}
