import { z } from 'zod';

export interface AppEnv {
  apiUrl: string;
}

const envSchema = z.object({
  VITE_API_URL: z.url({ error: 'VITE_API_URL debe ser una URL completa, por ejemplo http://localhost:3000' }),
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
    throw new Error(`Configuración no válida: ${z.prettifyError(result.error)} (VITE_API_URL, ver README.md)`);
  }
  return { apiUrl: withoutTrailingSlashes(result.data.VITE_API_URL) };
}
