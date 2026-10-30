import { addDays, todayKey } from '../../src/shared/date/day.util';
import { createTasks } from '../fixtures/api-client';
import { expect, test as authTest } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { test } from '../fixtures/tasks.fixture';
import { AccountPage } from '../pages/account.po';
import { AlertsPage } from '../pages/alerts.po';
import { HistoryPage } from '../pages/history.po';
import { LoginPage } from '../pages/login.po';
import { RegisterPage } from '../pages/register.po';
import { TaskFormDialog } from '../pages/task-form.po';

// RNF-03, CE-07 y CONSTITUTION.md VII.5 en cada pantalla y cada diálogo, en los 3 tamaños de los 6 proyectos:
// sin desplazamiento horizontal de la página, cada control dentro de la pantalla y, en móvil, de 44×44 px

// Las contraseñas no tienen rol textbox: se pasan aparte desde su page object
authTest.describe('RNF-03: pantallas sin sesión', () => {
  authTest('RNF-03: inicio de sesión', async ({ page }, testInfo) => {
    const login = new LoginPage(page);
    await login.goto();
    await expectResponsive(page, testInfo, [login.password]);
  });

  authTest('RNF-03: registro', async ({ page }, testInfo) => {
    const register = new RegisterPage(page);
    await register.goto();
    await expect(register.heading).toBeVisible();
    await expectResponsive(page, testInfo, [register.password]);
  });
});

test.describe('RNF-03: pantallas con sesión', () => {
  test.beforeEach(async ({ page, freshAccount, board }) => {
    await createTasks(freshAccount, [
      { title: 'Una tarea con un título bastante largo para ver cómo se parte en la columna', date: todayKey() },
      { title: 'Revisar el informe', description: 'Capítulo 2', date: addDays(todayKey(), 2) },
    ]);
    await page.reload();
    await board.board.waitFor();
  });

  test('RNF-03: tablero, con el desplazamiento horizontal solo dentro de su zona', async ({
    page,
    board,
  }, testInfo) => {
    await expect(board.columns).toHaveCount(7);
    await expectResponsive(page, testInfo);
    // Las 7 columnas de 264 px no caben en ninguno de los 3 tamaños: se desplaza el tablero, nunca la página
    const scrolls = await board.board.evaluate((element) => element.scrollWidth > element.clientWidth);
    expect(scrolls).toBe(true);
  });

  test('RNF-03: formulario de crear y de editar tarea', async ({ page, board }, testInfo) => {
    await board.newTask.click();
    await expect(new TaskFormDialog(page).dialog).toBeVisible();
    await expectResponsive(page, testInfo);
    await page.keyboard.press('Escape');
    await board.column(addDays(todayKey(), 2)).getByRole('button', { name: 'Editar «Revisar el informe»' }).click();
    await expect(new TaskFormDialog(page, 'Editar tarea').dialog).toBeVisible();
    await expectResponsive(page, testInfo);
  });

  test('RNF-03: confirmar la eliminación de una tarea', async ({ page, board }, testInfo) => {
    await board.column(addDays(todayKey(), 2)).getByRole('button', { name: 'Eliminar «Revisar el informe»' }).click();
    await expect(page.getByRole('dialog', { name: '¿Eliminar la tarea?' })).toBeVisible();
    await expectResponsive(page, testInfo);
  });

  test('RNF-03: historial', async ({ page }, testInfo) => {
    const history = new HistoryPage(page);
    await history.goto();
    await expect(history.items).toHaveCount(2);
    await expectResponsive(page, testInfo);
  });

  test('RNF-03: avisos', async ({ page }, testInfo) => {
    const alerts = new AlertsPage(page);
    await alerts.goto();
    await expect(alerts.empty).toBeVisible();
    await expectResponsive(page, testInfo);
  });

  test('RNF-03: cuenta y su diálogo de borrado', async ({ page }, testInfo) => {
    const account = new AccountPage(page);
    await account.goto();
    await expect(account.heading).toBeVisible();
    await expectResponsive(page, testInfo, [account.currentPassword, account.newPassword]);
    await account.openDelete.click();
    await expect(account.deleteDialog).toBeVisible();
    await expectResponsive(page, testInfo, [account.deletePassword]);
  });
});
