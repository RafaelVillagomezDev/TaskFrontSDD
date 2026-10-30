import { formatDayLong } from '../../src/shared/date/date-format.util';
import { todayKey } from '../../src/shared/date/day.util';
import { expect, test } from '../fixtures/tasks.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { AccountPage } from '../pages/account.po';
import { AppShell } from '../pages/app-shell.po';

test.describe('HU-10: ver y editar mi perfil', () => {
  test('RF-38: desde la navegación, el perfil muestra el email, la fecha de alta y el nombre vacío', async ({
    page,
    board,
    freshAccount,
  }, testInfo) => {
    await board.board.waitFor();
    await new AppShell(page).navigateTo('Cuenta');
    const account = new AccountPage(page);
    await expect(account.heading).toBeVisible();
    await expect(page).toHaveURL(/\/account$/);
    await expect(account.profile).toContainText(freshAccount.email);
    // Cuenta creada hoy; la mayúscula inicial es de CSS
    await expect(account.profile).toContainText(new RegExp(formatDayLong(todayKey()), 'i'));
    await expect(account.name).toHaveValue('');
    await expectResponsive(page, testInfo);
  });

  test('RF-38 y RF-53: cambiar el nombre lo confirma, lo muestra en la navegación y se conserva al recargar', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    await account.name.fill('Ana E2E');
    await account.saveName.click();
    await expect(account.saved).toBeVisible();
    await expect(await new AppShell(page).displayName('Ana E2E')).toBeVisible();

    await page.reload();
    await expect(account.name).toHaveValue('Ana E2E');
  });

  test('borrar el nombre vuelve a mostrar el email en la navegación', async ({ page, board, freshAccount }) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    await account.name.fill('Temporal');
    await account.saveName.click();
    await expect(account.saved).toBeVisible();
    await account.name.fill('');
    await account.saveName.click();
    await expect(account.name).toHaveValue('');
    await expect(await new AppShell(page).displayName(freshAccount.email)).toBeVisible();
  });
});
