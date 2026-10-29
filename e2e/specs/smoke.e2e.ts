import { expect, test } from '@playwright/test';

const apiUrl = process.env.VITE_API_URL ?? 'http://localhost:3000';

// Comprueba la red del contenedor e2e (plan R-2): el navegador ve la app en localhost:5173
// y puede llamar a la API en localhost:3000 con cookies, con CORS aceptado
test('la app carga y el navegador llega a la API con credenciales', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Kompitu');

  const status = await page.evaluate(async (url) => {
    const response = await fetch(`${url}/auth/csrf`, { credentials: 'include' });
    return response.status;
  }, apiUrl);

  expect(status).toBe(200);
});
