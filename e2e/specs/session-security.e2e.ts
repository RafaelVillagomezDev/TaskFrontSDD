import type { Page } from '@playwright/test';

import { todayKey } from '@shared/date/day.util';
import { createTasks, registerAccount, uniqueAccount } from '../fixtures/api-client';
import { expect, test } from '../fixtures/tasks.fixture';
import { AppShell } from '../pages/app-shell.po';
import { LoginPage } from '../pages/login.po';

const SECRET_TASK = 'Tarea privada de la primera cuenta';
const EXPIRED_NOTICE = 'Tu sesión ha caducado. Inicia sesión de nuevo.';

// La sesión caduca de verdad: sin cookies, la siguiente petición responde MISSING_TOKEN y la aplicación da la sesión
// por terminada (plan 004 §7). Se pide una pantalla con datos navegando dentro de la app, sin recargar
async function expireSessionFrom(page: Page): Promise<void> {
  await page.context().clearCookies();
  await new AppShell(page).navigateTo('Historial');
}

test.describe('HU-01 (004): que nadie vea mis datos cuando caduca mi sesión', () => {
  test('RF-01 a RF-03: tras caducar la sesión, otra cuenta en la misma pestaña solo ve sus datos', async ({
    page,
    board,
    freshAccount,
    accountsToDelete,
  }) => {
    await createTasks(freshAccount, [{ title: SECRET_TASK, date: todayKey() }]);
    await page.reload();
    await expect(board.board.getByText(SECRET_TASK)).toBeVisible();

    await expireSessionFrom(page);
    const login = new LoginPage(page);
    await expect(login.heading).toBeVisible();
    await expect(login.notice).toContainText(EXPIRED_NOTICE);
    await expect(page).toHaveURL(/returnTo=%2Fhistory/);

    const other = uniqueAccount();
    await registerAccount(other);
    accountsToDelete.push(other);
    await login.login(other);

    // Vuelve a la pantalla en la que estaba (RF-03) y nunca aparece nada de la primera cuenta (RF-01, RF-02)
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByText('Todavía no tienes tareas.')).toBeVisible();
    await expect(page.getByText(SECRET_TASK)).toHaveCount(0);
    await new AppShell(page).navigateTo('Tablero');
    await expect(board.board).toBeVisible();
    await expect(page.getByText(SECRET_TASK)).toHaveCount(0);
  });
});

test.describe('HU-02 (004): cerrar sesión en todas mis pestañas a la vez', () => {
  test('RF-04 y RNF-03: cerrar sesión en una pestaña lleva la otra al inicio de sesión en menos de 1 s', async ({
    page,
    board,
  }) => {
    const other = await page.context().newPage();
    await other.goto('/');
    await expect(new LoginPage(other).heading).toHaveCount(0);
    await expect(other.getByRole('region', { name: 'Tareas de la semana' })).toBeVisible();

    await board.board.waitFor();
    await new AppShell(page).logout();
    await expect(page).toHaveURL(/\/login$/);

    // Como tras cerrar sesión: sin mensaje de caducada y sin pantalla a la que volver
    await expect(other).toHaveURL(/\/login$/, { timeout: 1000 });
    await expect(new LoginPage(other).heading).toBeVisible();
    await expect(other.getByText(EXPIRED_NOTICE)).toHaveCount(0);
    await expect(other.getByRole('region', { name: 'Tareas de la semana' })).toHaveCount(0);
  });

  test('RF-05: si la sesión caduca en una pestaña, la otra muestra el inicio de sesión con el mensaje de caducada', async ({
    page,
    board,
  }) => {
    const other = await page.context().newPage();
    await other.goto('/taskday');
    await expect(other.getByRole('heading', { level: 1, name: 'Hecho hoy' })).toBeVisible();

    await board.board.waitFor();
    await expireSessionFrom(page);
    await expect(new LoginPage(page).heading).toBeVisible();

    // Cada pestaña recuerda su propia pantalla (001 RF-07)
    const otherLogin = new LoginPage(other);
    await expect(otherLogin.heading).toBeVisible({ timeout: 1000 });
    await expect(otherLogin.notice).toContainText(EXPIRED_NOTICE);
    await expect(other).toHaveURL(/returnTo=%2Ftaskday/);
  });
});
