import { buildClientTimeHeaders } from '@shared/api/client-time.util';
import { loginInPage } from '../fixtures/api-client';
import { expect, test } from '../fixtures/session.fixture';
import { BoardPage } from '../pages/board.po';

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

// 003 plan D-15 y R-6: el login por API deja la cookie Secure en el navegador y la app abre con la sesión iniciada
test('la sesión iniciada por API llega a la aplicación', async ({ page, freshAccount }) => {
  await loginInPage(page, freshAccount);

  await page.goto('/');
  // El tablero (y no el inicio de sesión) en los tres tamaños: en móvil y tablet la navegación va en el cajón
  await expect(new BoardPage(page).heading).toBeVisible();
  await expect(page).toHaveURL('/');
});

// 003 plan R-8: la API local tiene desplegada la funcionalidad 004 (sesiones pomodoro)
test('la API local responde a GET /pomodoros con la sesión iniciada', async ({ signedInPage }) => {
  const response = await signedInPage.request.get(`${apiUrl}/pomodoros`, { headers: { ...buildClientTimeHeaders() } });
  expect(response.status()).toBe(200);
});
