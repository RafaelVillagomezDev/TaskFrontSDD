import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/tasks.fixture';
import { AccountPage } from '../pages/account.po';

// RF-02: un valor no válido nunca llega a la API
function trackAccountRequests(page: Page, method: string, path: string): string[] {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === method && new URL(request.url()).pathname === path) requests.push(request.url());
  });
  return requests;
}

test.describe('RF-46: campo nombre del perfil', () => {
  test.beforeEach(async ({ page, board }) => {
    await board.board.waitFor();
    await new AccountPage(page).goto();
  });

  test('RF-02: name «101 caracteres» → «El nombre no puede tener más de 100 caracteres.» sin llamar a la API', async ({
    page,
  }) => {
    const updates = trackAccountRequests(page, 'PATCH', '/me');
    const account = new AccountPage(page);
    await account.name.fill('n'.repeat(101));
    await account.saveName.click();
    await expect(account.name).toHaveAccessibleDescription(/El nombre no puede tener más de 100 caracteres\./);
    await expect(account.name).toHaveAttribute('aria-invalid', 'true');
    expect(updates).toEqual([]);
  });

  test('RF-46: 100 caracteres con espacios en los extremos se guardan recortados', async ({ page }) => {
    const account = new AccountPage(page);
    await account.name.fill(` ${'n'.repeat(100)} `);
    await account.saveName.click();
    await expect(account.saved).toBeVisible();
    await expect(account.name).toHaveValue('n'.repeat(100));
  });

  test('RF-46: solo espacios cuenta como nombre vacío', async ({ page }) => {
    const account = new AccountPage(page);
    await account.name.fill('   ');
    await account.saveName.click();
    await expect(account.saved).toBeVisible();
    await expect(account.name).toHaveValue('');
  });

  test('solo con teclado: escribir el nombre y guardar con Enter', async ({ page }) => {
    const account = new AccountPage(page);
    await account.name.focus();
    await page.keyboard.type('Con teclado');
    await page.keyboard.press('Enter');
    await expect(account.saved).toBeVisible();
    await expect(account.name).toHaveValue('Con teclado');
  });
});

test.describe('RF-46: campos de cambiar contraseña', () => {
  test.beforeEach(async ({ page, board }) => {
    await board.board.waitFor();
    await new AccountPage(page).goto();
  });

  const cases: { field: 'currentPassword' | 'newPassword'; value: string; message: string }[] = [
    { field: 'currentPassword', value: '', message: 'Escribe tu contraseña actual.' },
    { field: 'newPassword', value: '', message: 'Escribe la contraseña nueva.' },
    { field: 'newPassword', value: 'n'.repeat(11), message: 'La contraseña debe tener al menos 12 caracteres.' },
    { field: 'newPassword', value: 'n'.repeat(129), message: 'La contraseña no puede tener más de 128 caracteres.' },
  ];

  for (const { field, value, message } of cases) {
    test(`RF-02: ${field} «${value.length > 0 ? `${String(value.length)} caracteres` : ''}» → «${message}» sin llamar a la API`, async ({
      page,
    }) => {
      const requests = trackAccountRequests(page, 'PATCH', '/me/password');
      const account = new AccountPage(page);
      const valid = { currentPassword: 'cualquiera', newPassword: 'n'.repeat(12) };
      const values = { ...valid, [field]: value };
      await account.currentPassword.fill(values.currentPassword);
      await account.newPassword.fill(values.newPassword);
      await account.changePassword.click();
      await expect(account[field]).toHaveAccessibleDescription(new RegExp(message));
      await expect(account[field]).toHaveAttribute('aria-invalid', 'true');
      expect(requests).toEqual([]);
    });
  }

  test('RF-46: 128 caracteres con espacios en los extremos se aceptan sin recortar', async ({ page, freshAccount }) => {
    const account = new AccountPage(page);
    const newPassword = ` ${'n'.repeat(126)} `;
    await account.currentPassword.fill(freshAccount.password);
    await account.newPassword.fill(newPassword);
    await account.changePassword.click();
    await expect(account.passwordChanged).toBeVisible();
    // La fixture borra la cuenta con la contraseña que tenga al terminar
    freshAccount.password = newPassword;
  });

  test('solo con teclado: mostrar la contraseña y cambiarla con Enter', async ({ page, freshAccount }) => {
    const account = new AccountPage(page);
    const newPassword = `teclado-${crypto.randomUUID()}`;
    await account.currentPassword.focus();
    await page.keyboard.type(freshAccount.password);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(account.currentPassword).toHaveAttribute('type', 'text');
    await account.newPassword.focus();
    await page.keyboard.type(newPassword);
    await page.keyboard.press('Enter');
    await expect(account.passwordChanged).toBeVisible();
    freshAccount.password = newPassword;
  });
});

test.describe('RF-46: campo contraseña de borrar la cuenta', () => {
  test('RF-49: sin contraseña → «Escribe tu contraseña para borrar la cuenta.» sin llamar a la API', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    const requests = trackAccountRequests(page, 'DELETE', '/me');
    await account.openDelete.click();
    await account.confirmDelete.click();
    await expect(account.deletePassword).toHaveAccessibleDescription('Escribe tu contraseña para borrar la cuenta.');
    await expect(account.deleteDialog).toBeVisible();
    expect(requests).toEqual([]);
  });

  test('solo con teclado: abrir, escribir una contraseña incorrecta, Enter, y cerrar con Escape', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    await account.openDelete.focus();
    await page.keyboard.press('Enter');
    await expect(account.deleteDialog).toBeVisible();
    await account.deletePassword.focus();
    await page.keyboard.type('no-es-la-contraseña');
    await page.keyboard.press('Enter');
    await expect(account.deletePassword).toHaveAccessibleDescription('La contraseña no es correcta.');
    await page.keyboard.press('Escape');
    await expect(account.deleteDialog).toBeHidden();
    await expect(account.openDelete).toBeFocused();
  });
});
