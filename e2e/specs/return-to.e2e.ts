import type { Page } from '@playwright/test';

import type { Account } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { AppShell } from '../pages/app-shell.po';
import { LoginPage } from '../pages/login.po';

// Valores de vuelta de los casos límite de la spec 004 (RF-08, CE-03)
const TO_BOARD = [
  'https://ejemplo.com',
  '//ejemplo.com',
  '/\\ejemplo.com',
  '/%5Cejemplo.com',
  'javascript:alert(1)',
  'tablero',
  '',
  '/history\nx',
];

const VALID = ['/history?status=completed&page=2', '/taskday', '/pomodoro/history'];

// Inicia sesión desde /login con el valor de vuelta en la URL y cierra sesión al terminar, para probar el siguiente
async function loginReturningTo(page: Page, account: Account, value: string): Promise<URL> {
  const login = new LoginPage(page);
  await login.goto(`/login?${new URLSearchParams({ returnTo: value }).toString()}`);
  await login.login(account);
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Iniciar sesión');
  const landed = new URL(page.url());
  await new AppShell(page).logout();
  await expect(login.heading).toBeVisible();
  return landed;
}

test.describe('HU-03 (004): volver solo a pantallas de la aplicación tras iniciar sesión', () => {
  test('RF-08: cada valor que no es una ruta de la aplicación lleva al tablero', async ({ page, freshAccount }) => {
    for (const value of TO_BOARD) {
      const landed = await loginReturningTo(page, freshAccount, value);
      expect.soft(landed.origin, value).toBe(new URL(page.url()).origin);
      expect.soft(landed.pathname, value).toBe('/');
    }
  });

  test('RF-08: cada ruta de la aplicación vuelve a su pantalla con su búsqueda', async ({ page, freshAccount }) => {
    for (const value of VALID) {
      const landed = await loginReturningTo(page, freshAccount, value);
      expect.soft(`${landed.pathname}${landed.search}`, value).toBe(value);
    }
  });
});
