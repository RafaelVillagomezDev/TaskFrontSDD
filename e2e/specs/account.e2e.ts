import { formatDayLong } from '../../src/shared/date/date-format.util';
import { todayKey } from '../../src/shared/date/day.util';
import { expect, test } from '../fixtures/tasks.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { AccountPage } from '../pages/account.po';
import { AppShell } from '../pages/app-shell.po';
import { LoginPage } from '../pages/login.po';

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

// Siempre con una cuenta desechable (freshAccount), nunca con el usuario de prueba compartido (tasks.md T105)
test.describe('HU-11: cambiar mi contraseña y borrar mi cuenta', () => {
  test('RF-39: cambiar la contraseña mantiene la sesión, lo confirma y la nueva sirve para entrar', async ({
    page,
    board,
    freshAccount,
  }, testInfo) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    const newPassword = `nueva-${crypto.randomUUID()}`;
    await account.currentPassword.fill(freshAccount.password);
    await account.newPassword.fill(newPassword);
    await account.changePassword.click();
    await expect(account.passwordChanged).toBeVisible();
    // La fixture borra la cuenta al terminar con la contraseña que tenga entonces
    freshAccount.password = newPassword;
    await expect(account.currentPassword).toHaveValue('');
    await expectResponsive(page, testInfo);

    // La sesión sigue abierta
    await page.reload();
    await expect(account.heading).toBeVisible();

    await new AppShell(page).logout();
    const login = new LoginPage(page);
    await login.heading.waitFor();
    await login.login(freshAccount);
    await expect(board.board).toBeVisible();
  });

  test('RF-48: con la contraseña actual incorrecta lo indica en su campo y no la cambia', async ({ page, board }) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    await account.currentPassword.fill('no-es-la-contraseña');
    await account.newPassword.fill(`nueva-${crypto.randomUUID()}`);
    await account.changePassword.click();
    await expect(account.currentPassword).toHaveAccessibleDescription('La contraseña no es correcta.');
    await expect(account.passwordChanged).toHaveCount(0);
  });

  test('RF-49: borrar la cuenta avisa de lo que se elimina, lleva al inicio de sesión y ya no se puede entrar', async ({
    page,
    board,
    freshAccount,
  }, testInfo) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    await account.openDelete.click();
    await expect(account.deleteDialog).toContainText('Se eliminarán para siempre tu cuenta, todas tus tareas');
    await expectResponsive(page, testInfo);
    await account.deletePassword.fill(freshAccount.password);
    await account.confirmDelete.click();

    const login = new LoginPage(page);
    await expect(login.heading).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await login.login(freshAccount);
    await expect(login.error).toContainText('El email o la contraseña no son correctos.');
  });

  test('RF-48 y RF-49: con la contraseña incorrecta no borra nada; «Cancelar» cierra', async ({ page, board }) => {
    await board.board.waitFor();
    const account = new AccountPage(page);
    await account.goto();
    await account.openDelete.click();
    await account.deletePassword.fill('no-es-la-contraseña');
    await account.confirmDelete.click();
    await expect(account.deletePassword).toHaveAccessibleDescription('La contraseña no es correcta.');
    await account.deleteDialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(account.deleteDialog).toBeHidden();
    await expect(account.openDelete).toBeFocused();
    await page.reload();
    await expect(account.heading).toBeVisible();
  });
});
