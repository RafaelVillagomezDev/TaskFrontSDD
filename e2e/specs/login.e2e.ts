import { requireEnv, uniqueAccount } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { AppShell } from '../pages/app-shell.po';
import { LoginPage } from '../pages/login.po';

const GENERIC_ERROR = 'El email o la contraseña no son correctos.';

test.describe('HU-01: inicio y cierre de sesión', () => {
  test('RF-04: con la contraseña correcta llega al tablero', async ({ page, testUser }, testInfo) => {
    const login = new LoginPage(page);
    await login.goto();
    await expectResponsive(page, testInfo, [login.password]);
    await login.login(testUser);

    const shell = new AppShell(page);
    await expect(shell.pageHeading('Tablero')).toBeVisible();
    await expect(page).toHaveURL('/');
    await expectResponsive(page, testInfo);
  });

  test('RF-04: contraseña incorrecta o email inexistente → el mismo mensaje genérico', async ({
    page,
    freshAccount,
  }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.login({ email: freshAccount.email, password: 'contraseña equivocada' });
    await expect(login.error).toHaveText(GENERIC_ERROR);
    await expect(page).toHaveURL('/login');

    await login.login(uniqueAccount());
    await expect(login.error).toHaveText(GENERIC_ERROR);
  });

  test('RF-08 y RF-07: sin sesión una pantalla privada lleva al inicio de sesión y, al entrar, vuelve a ella', async ({
    page,
    testUser,
  }) => {
    await page.goto('/history');
    const login = new LoginPage(page);
    await expect(login.heading).toBeVisible();
    await expect(page).toHaveURL('/login?returnTo=%2Fhistory');

    await login.login(testUser);
    await expect(new AppShell(page).pageHeading('Historial')).toBeVisible();
    await expect(page).toHaveURL('/history');
  });

  test('RF-50: cerrar sesión vuelve al inicio de sesión y «atrás» no vuelve a la pantalla privada', async ({
    page,
    testUser,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(testUser);
    const shell = new AppShell(page);
    await expect(shell.pageHeading('Tablero')).toBeVisible();
    // Historial del navegador: tablero → historial
    await shell.navigateTo('Historial');
    await expect(shell.pageHeading('Historial')).toBeVisible();

    await shell.logout();
    await expect(login.heading).toBeVisible();
    await expect(page).toHaveURL('/login');

    // «Atrás» lleva a la entrada del tablero, que sin sesión vuelve al inicio de sesión
    await page.goBack();
    await expect(login.heading).toBeVisible();
    await expect(page).toHaveURL('/login');
    await expect(shell.pageHeading('Tablero')).toHaveCount(0);
  });

  test('D-1 y RNF-06: tras recargar sigue la sesión y el token CSRF recuperado de GET /me sirve', async ({
    page,
    testUser,
  }) => {
    const login = new LoginPage(page);
    await login.goto('/login?returnTo=%2Fhistory');
    await login.login(testUser);
    const shell = new AppShell(page);
    await expect(shell.pageHeading('Historial')).toBeVisible();

    await page.reload();
    await expect(shell.pageHeading('Historial')).toBeVisible();
    await expect(page).toHaveURL('/history');

    // POST /auth/logout exige X-CSRF-Token: solo cierra la sesión en la API si el token se recuperó al recargar
    await shell.logout();
    await expect(login.heading).toBeVisible();
    const me = await page.request.get(`${requireEnv('VITE_API_URL')}/me`);
    expect(me.status()).toBe(401);
  });
});
