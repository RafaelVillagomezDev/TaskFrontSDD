import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/tasks.fixture';
import { AccountPage } from '../pages/account.po';

// RF-02: un nombre no válido nunca llega a la API
function trackProfileUpdates(page: Page): string[] {
  const updates: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && new URL(request.url()).pathname === '/me') updates.push(request.url());
  });
  return updates;
}

test.describe('RF-46: campo nombre del perfil', () => {
  test.beforeEach(async ({ page, board }) => {
    await board.board.waitFor();
    await new AccountPage(page).goto();
  });

  test('RF-02: name «101 caracteres» → «El nombre no puede tener más de 100 caracteres.» sin llamar a la API', async ({
    page,
  }) => {
    const updates = trackProfileUpdates(page);
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
