import type { Locator, Page } from '@playwright/test';

import { uniqueAccount } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { LoginPage } from '../pages/login.po';
import { RegisterPage } from '../pages/register.po';

const DOMAIN_LABEL_LENGTH = 60;

// Email válido de la longitud pedida, con etiquetas de dominio cortas para que también lo acepte la API
function emailOfLength(length: number, local = 'a'.repeat(10)): string {
  let remaining = length - local.length - '@.com'.length;
  const labels: string[] = [];
  while (remaining > DOMAIN_LABEL_LENGTH + 1) {
    labels.push('b'.repeat(DOMAIN_LABEL_LENGTH));
    remaining -= DOMAIN_LABEL_LENGTH + 1;
  }
  labels.push('b'.repeat(remaining));
  return `${local}@${labels.join('.')}.com`;
}

// RF-02: los errores de validación nunca llegan a la API
function trackAuthRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/auth/')) requests.push(request.url());
  });
  return requests;
}

async function expectFieldError(field: Locator, message: string): Promise<void> {
  await expect(field).toHaveAccessibleDescription(new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await expect(field).toHaveAttribute('aria-invalid', 'true');
}

test.describe('RF-46: campos del registro', () => {
  const cases: { field: 'email' | 'password' | 'name'; value: string; message: string }[] = [
    { field: 'email', value: '', message: 'Escribe tu email.' },
    { field: 'email', value: '   ', message: 'Escribe tu email.' },
    { field: 'email', value: 'ana@', message: 'Escribe un email válido, como ana@ejemplo.com.' },
    { field: 'email', value: emailOfLength(255), message: 'El email no puede tener más de 254 caracteres.' },
    { field: 'password', value: '', message: 'Escribe tu contraseña.' },
    { field: 'password', value: 'a'.repeat(11), message: 'La contraseña debe tener al menos 12 caracteres.' },
    { field: 'password', value: 'a'.repeat(129), message: 'La contraseña no puede tener más de 128 caracteres.' },
    { field: 'name', value: 'n'.repeat(101), message: 'El nombre no puede tener más de 100 caracteres.' },
  ];

  for (const { field, value, message } of cases) {
    test(`RF-02: ${field} con ${String(value.length)} caracteres → «${message}» sin llamar a la API`, async ({
      page,
    }) => {
      const register = new RegisterPage(page);
      await register.goto();
      const requests = trackAuthRequests(page);
      const valid = { email: 'ana@example.com', password: 'a'.repeat(12), name: 'Ana' };
      await register.email.fill(field === 'email' ? value : valid.email);
      await register.password.fill(field === 'password' ? value : valid.password);
      await register.name.fill(field === 'name' ? value : valid.name);
      await register.submit.click();

      await expectFieldError(register[field], message);
      expect(requests).toEqual([]);
    });
  }

  test('RF-46: valores en la frontera válidos (email de 254, contraseña de 128, nombre de 100) crean la cuenta', async ({
    page,
    accountsToDelete,
  }) => {
    const account = { email: emailOfLength(254, `e2e-${crypto.randomUUID()}`), password: 'p'.repeat(128) };
    expect(account.email).toHaveLength(254);
    accountsToDelete.push(account);
    const register = new RegisterPage(page);
    await register.goto();
    await register.email.fill(account.email);
    await register.password.fill(account.password);
    await register.name.fill('n'.repeat(100));
    await register.submit.click();
    await expect(new LoginPage(page).notice).toHaveText('Cuenta creada. Ya puedes iniciar sesión.');
  });

  test('solo con teclado: rellenar, mostrar la contraseña y enviar con Enter', async ({ page, accountsToDelete }) => {
    const account = uniqueAccount();
    accountsToDelete.push(account);
    const register = new RegisterPage(page);
    await register.goto();

    await register.email.focus();
    await page.keyboard.type(account.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(account.password);
    await page.keyboard.press('Tab');
    await expect(register.showPassword).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(register.password).toHaveAttribute('type', 'text');
    await page.keyboard.press('Tab');
    await expect(register.name).toBeFocused();
    await page.keyboard.type('Ana');
    await page.keyboard.press('Enter');

    await expect(new LoginPage(page).notice).toHaveText('Cuenta creada. Ya puedes iniciar sesión.');
  });
});

test.describe('RF-46 y S-12: campos del inicio de sesión', () => {
  const cases: { field: 'email' | 'password'; value: string; message: string }[] = [
    { field: 'email', value: '', message: 'Escribe tu email.' },
    { field: 'email', value: 'ana.example.com', message: 'Escribe un email válido, como ana@ejemplo.com.' },
    { field: 'password', value: '', message: 'Escribe tu contraseña.' },
  ];

  for (const { field, value, message } of cases) {
    test(`RF-02: ${field} «${value}» → «${message}» sin llamar a la API`, async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      const requests = trackAuthRequests(page);
      await login.email.fill(field === 'email' ? value : 'ana@example.com');
      await login.password.fill(field === 'password' ? value : 'cualquiera');
      await login.submit.click();

      await expectFieldError(login[field], message);
      expect(requests).toEqual([]);
    });
  }

  test('solo con teclado: entra con Tab y Enter', async ({ page, testUser }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.email.focus();
    await page.keyboard.type(testUser.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(testUser.password);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
  });
});
