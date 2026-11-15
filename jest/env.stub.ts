// Sustituye a src/shared/config/env.ts en Jest, donde import.meta.env no existe (plan R-3)
export const env = {
  apiUrl: 'http://localhost:3000',
  // Site key de prueba de Cloudflare que siempre pasa (spec 005 RF-12, S-03)
  turnstileSiteKey: '1x00000000000000000000AA',
};
