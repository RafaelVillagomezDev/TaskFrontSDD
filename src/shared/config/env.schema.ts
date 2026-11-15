import { z } from 'zod';

export interface AppEnv {
  apiUrl: string;
  // Site key pública del widget de Cloudflare Turnstile (spec 005 RF-11, S-01)
  turnstileSiteKey: string;
}

const envSchema = z.object({
  VITE_API_URL: z.url({ error: 'VITE_API_URL debe ser una URL completa, por ejemplo http://localhost:3000' }),
  VITE_TURNSTILE_SITE_KEY: z
    .string({ error: 'Falta VITE_TURNSTILE_SITE_KEY, la site key pública de Cloudflare Turnstile' })
    .trim()
    .min(1, { error: 'VITE_TURNSTILE_SITE_KEY no puede estar vacía' }),
});

// Sin expresión regular: evita el riesgo de backtracking (SonarQube S5852)
function withoutTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') end -= 1;
  return url.slice(0, end);
}

// Valida las variables de Vite al arrancar: un despliegue mal configurado falla al cargar, no en la primera petición
export function parseEnv(source: unknown): AppEnv {
  const result = envSchema.safeParse(source ?? {});
  if (!result.success) {
    throw new Error(
      `Configuración no válida: ${z.prettifyError(result.error)} (VITE_API_URL y VITE_TURNSTILE_SITE_KEY, ver README.md)`,
    );
  }
  return {
    apiUrl: withoutTrailingSlashes(result.data.VITE_API_URL),
    turnstileSiteKey: result.data.VITE_TURNSTILE_SITE_KEY,
  };
}
