import type { Page, Request, Route } from '@playwright/test';

import { E2E_TURNSTILE_TOKEN, uniqueAccount } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { LoginPage } from '../pages/login.po';
import { RegisterPage } from '../pages/register.po';

// Spec 005: widget de Cloudflare Turnstile en el inicio de sesión y el registro. El camino feliz usa el widget real
// con la site key de prueba que siempre pasa y la API real; los rechazos de la API se simulan (plan D-10)

const API_PORT = '3000';
const TURNSTILE_SCRIPT = /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js/;
const TOKEN_FIELD = 'turnstileToken';
// El script bloqueado se detecta al agotar la espera de carga del widget (TURNSTILE_LOAD_TIMEOUT_MS, 10 s)
const LOAD_FAILURE_TIMEOUT_MS = 15_000;
// Pulsaciones de Tab como máximo desde la contraseña hasta el botón: mostrar contraseña, los elementos del iframe de
// Cloudflare (Firefox recorre también sus enlaces) y el botón
const MAX_TABS = 12;

const MESSAGES = {
  required: 'Completa la comprobación de seguridad.',
  loadFailed: 'No se ha podido cargar la comprobación de seguridad. Recarga la página para intentarlo de nuevo.',
  failed: 'No hemos podido comprobar que eres una persona. Inténtalo de nuevo.',
  unavailable: 'El servicio de verificación no responde. Inténtalo de nuevo en unos minutos.',
};

function isApi(request: Request, path: string): boolean {
  const url = new URL(request.url());
  return url.port === API_PORT && url.pathname === path && request.method() === 'POST';
}

// Cuerpos de las peticiones POST a una ruta de la API durante el test
function trackBodies(page: Page, path: string): unknown[] {
  const bodies: unknown[] = [];
  page.on('request', (request) => {
    if (isApi(request, path)) bodies.push(request.postDataJSON());
  });
  return bodies;
}

function failWith(status: number, code: string, field?: string): (route: Route) => Promise<void> {
  const details = field === undefined ? undefined : [{ field, message: 'texto técnico de la API' }];
  return (route) =>
    route.fulfill({ status, json: { success: false, status, error: { code, message: 'texto técnico', details } } });
}

async function routeApi(page: Page, path: string, handler: (route: Route) => Promise<void>): Promise<void> {
  await page.route(
    (url) => url.port === API_PORT && url.pathname === path,
    (route) => (route.request().method() === 'POST' ? handler(route) : route.continue()),
  );
}

test.describe('HU-01 y HU-02: el acceso exige la comprobación de Turnstile', () => {
  test('RF-01, RF-02, RF-07, RF-12: inicia sesión con el widget real de prueba y envía su token en el cuerpo', async ({
    page,
    testUser,
  }, testInfo) => {
    const bodies = trackBodies(page, '/auth/login');
    const login = new LoginPage(page);
    await login.goto();
    await expectResponsive(page, testInfo, [login.email, login.password, login.submit]);

    await login.login(testUser);

    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    expect(bodies).toEqual([{ ...testUser, [TOKEN_FIELD]: E2E_TURNSTILE_TOKEN }]);
  });

  test('RF-01, RF-07: se registra con el widget real y envía el token en el cuerpo', async ({
    page,
    accountsToDelete,
  }, testInfo) => {
    const account = uniqueAccount();
    accountsToDelete.push(account);
    const bodies = trackBodies(page, '/auth/register');
    const register = new RegisterPage(page);
    await register.goto();
    await expectResponsive(page, testInfo, [register.email, register.password, register.name, register.submit]);

    await register.email.fill(account.email);
    await register.password.fill(account.password);
    await register.submit.click();

    await expect(new LoginPage(page).notice).toHaveText('Cuenta creada. Ya puedes iniciar sesión.');
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({ ...account, [TOKEN_FIELD]: E2E_TURNSTILE_TOKEN });
  });

  test('RF-03: sin token no envía nada y lo pide; al llegar el token se puede entrar', async ({
    page,
    testUser,
  }) => {
    // El script de Cloudflare se retiene hasta que el test lo suelta
    let release = (): void => undefined;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(TURNSTILE_SCRIPT, async (route) => {
      await released;
      await route.continue();
    });
    const bodies = trackBodies(page, '/auth/login');
    const login = new LoginPage(page);
    await login.open();

    await login.email.fill(testUser.email);
    await login.password.fill(testUser.password);
    await login.submit.click();
    await expect(page.getByText(MESSAGES.required)).toBeVisible();
    await expect(login.password).toHaveValue(testUser.password);
    expect(bodies).toEqual([]);

    release();
    await login.waitForVerification();
    await expect(page.getByText(MESSAGES.required)).toBeHidden();
    await login.submit.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
  });

  test('RF-06: si el script de Cloudflare está bloqueado, lo indica y no envía nada', async ({ page }) => {
    await page.route(TURNSTILE_SCRIPT, (route) => route.abort('blockedbyclient'));
    const bodies = trackBodies(page, '/auth/login');
    const login = new LoginPage(page);
    await login.open();

    await expect(page.getByText(MESSAGES.loadFailed)).toBeVisible({ timeout: LOAD_FAILURE_TIMEOUT_MS });
    await login.email.fill('ana@example.com');
    await login.password.fill('cualquier contraseña');
    await login.submit.click();
    await expect(page.getByText(MESSAGES.loadFailed)).toBeVisible();
    expect(bodies).toEqual([]);
  });

  test('RF-05: tras credenciales incorrectas el widget se reinicia y el siguiente intento lleva token', async ({
    page,
  }) => {
    const bodies = trackBodies(page, '/auth/login');
    const account = uniqueAccount();
    const login = new LoginPage(page);
    await login.goto();

    await login.login(account);
    await expect(login.error).toHaveText('El email o la contraseña no son correctos.');
    await login.login(account);
    await expect.poll(() => bodies.length).toBe(2);
    for (const body of bodies) expect(body).toMatchObject({ [TOKEN_FIELD]: E2E_TURNSTILE_TOKEN });
  });

  const rejections = [
    { rf: 'RF-08', status: 403, code: 'TURNSTILE_FAILED', field: undefined, message: MESSAGES.failed },
    { rf: 'RF-13', status: 503, code: 'TURNSTILE_UNAVAILABLE', field: undefined, message: MESSAGES.unavailable },
    { rf: 'RF-14', status: 400, code: 'VALIDATION_ERROR', field: TOKEN_FIELD, message: MESSAGES.failed },
  ];

  for (const { rf, status, code, field, message } of rejections) {
    test(`${rf}: ${code} en el inicio de sesión → «${message}» bajo el widget, sin perder lo escrito`, async ({
      page,
      testUser,
    }) => {
      await routeApi(page, '/auth/login', failWith(status, code, field));
      const login = new LoginPage(page);
      await login.goto();

      await login.login(testUser);

      await expect(page.getByText(message)).toBeVisible();
      await expect(login.email).toHaveValue(testUser.email);
      await expect(login.password).toHaveValue(testUser.password);
      await expect(page).toHaveURL('/login');
      // RF-05: el widget pide un token nuevo para el siguiente intento
      await login.waitForVerification();
    });

    test(`${rf}: ${code} en el registro → «${message}» bajo el widget, sin crear la cuenta`, async ({ page }) => {
      await routeApi(page, '/auth/register', failWith(status, code, field));
      const account = uniqueAccount();
      const register = new RegisterPage(page);
      await register.goto();

      await register.email.fill(account.email);
      await register.password.fill(account.password);
      await register.submit.click();

      await expect(page.getByText(message)).toBeVisible();
      await expect(register.email).toHaveValue(account.email);
      await expect(page).toHaveURL('/register');
      await register.waitForVerification();
    });
  }

  test('RNF-01: solo con teclado, el foco pasa de la contraseña al botón sin quedarse en el widget', async ({
    page,
    testUser,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.email.fill(testUser.email);
    await login.password.fill(testUser.password);
    await login.password.focus();

    let tabs = 0;
    while (tabs < MAX_TABS && !(await login.submit.evaluate((element) => element === document.activeElement))) {
      await page.keyboard.press('Tab');
      tabs += 1;
    }
    await expect(login.submit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
  });
});
