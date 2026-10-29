import { uniqueAccount } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { LoginPage } from '../pages/login.po';
import { RegisterPage } from '../pages/register.po';

test.describe('HU-01: registro', () => {
  test('RF-01: con un email nuevo lleva al inicio de sesión con el email escrito y el aviso', async ({
    page,
    accountsToDelete,
  }, testInfo) => {
    const account = uniqueAccount();
    accountsToDelete.push(account);
    const register = new RegisterPage(page);
    await register.goto();
    await expectResponsive(page, testInfo, [register.password]);

    await register.email.fill(account.email);
    await register.password.fill(account.password);
    await register.name.fill('Ana E2E');
    await register.submit.click();

    const login = new LoginPage(page);
    await expect(login.heading).toBeVisible();
    await expect(page).toHaveURL('/login');
    await expect(login.email).toHaveValue(account.email);
    await expect(login.notice).toHaveText('Cuenta creada. Ya puedes iniciar sesión.');

    // La cuenta existe: se puede entrar con ella y se llega al tablero
    await login.password.fill(account.password);
    await login.submit.click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
  });

  test('RF-03: un email ya registrado muestra el error en el email y conserva el resto', async ({
    page,
    freshAccount,
  }) => {
    const register = new RegisterPage(page);
    await register.goto();
    await register.email.fill(freshAccount.email);
    await register.password.fill('otra contraseña larga');
    await register.name.fill('Ana');
    await register.submit.click();

    await expect(page.getByText('Ya existe una cuenta con este email.')).toBeVisible();
    await expect(register.email).toHaveAccessibleDescription('Ya existe una cuenta con este email.');
    await expect(register.password).toHaveValue('otra contraseña larga');
    await expect(register.name).toHaveValue('Ana');
    await expect(page).toHaveURL('/register');
  });
});
