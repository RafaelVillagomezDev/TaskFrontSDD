import type { Page } from '@playwright/test';

import { formatDayLong } from '../../src/shared/date/date-format.util';
import { addDays, todayKey } from '../../src/shared/date/day.util';
import { createTasks, type Account, type NewTask } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { AppShell } from '../pages/app-shell.po';
import { BoardPage } from '../pages/board.po';
import { HistoryPage } from '../pages/history.po';
import { LoginPage } from '../pages/login.po';

const HISTORY_PAGE_SIZE = 50;

// La API solo deja crear tareas de hoy en adelante y completar las de hoy
const TASKS: NewTask[] = [
  { title: 'Comprar pan', date: todayKey(), completed: true },
  { title: 'Llamar al banco', date: todayKey() },
  { title: 'Revisar el informe', date: addDays(todayKey(), 2) },
  { title: 'Pagar el alquiler', date: addDays(todayKey(), 5) },
];

async function login(page: Page, account: Account): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(account);
  await new BoardPage(page).board.waitFor();
}

test.describe('HU-08: consultar mi historial con filtros', () => {
  test('RF-31 y RF-34: desde la navegación, todas las tareas por fecha, con su fecha, su estado y los totales', async ({
    page,
    freshAccount,
  }, testInfo) => {
    await createTasks(freshAccount, TASKS);
    await login(page, freshAccount);
    await new AppShell(page).navigateTo('Historial');
    const history = new HistoryPage(page);
    await expect(history.heading).toBeVisible();
    await expect(page).toHaveURL(/\/history$/);

    await expect(history.items).toHaveCount(TASKS.length);
    await expect(history.items.nth(0)).toContainText('Comprar pan');
    await expect(history.items.nth(0)).toContainText('Completada');
    await expect(history.items.nth(1)).toContainText('Llamar al banco');
    await expect(history.items.nth(1)).toContainText('Pendiente');
    await expect(history.items.nth(3)).toContainText('Pagar el alquiler');
    // La fecha se muestra con la mayúscula inicial por CSS; el texto es el de formatDayLong
    await expect(history.items.nth(3)).toContainText(new RegExp(formatDayLong(addDays(todayKey(), 5)), 'i'));
    await expect(history.pagination).toContainText(`Página 1 de 1 · ${String(TASKS.length)} tareas`);
    await expectResponsive(page, testInfo);
  });

  test('RF-32 y D-8: filtrar por estado se refleja en la URL y se conserva al recargar', async ({
    page,
    freshAccount,
  }) => {
    await createTasks(freshAccount, TASKS);
    await login(page, freshAccount);
    const history = new HistoryPage(page);
    await history.goto();
    await expect(history.items).toHaveCount(TASKS.length);

    await history.status.selectOption({ label: 'Pendientes' });
    await history.apply.click();
    await expect(page).toHaveURL(/\?status=pending$/);
    await expect(history.items).toHaveCount(3);
    await expect(history.list).not.toContainText('Comprar pan');

    await page.reload();
    await expect(history.status).toHaveValue('pending');
    await expect(history.items).toHaveCount(3);

    await history.status.selectOption({ label: 'Completadas' });
    await history.apply.click();
    await expect(history.items).toHaveCount(1);
    await expect(history.items).toContainText('Comprar pan');

    await history.clear.click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(history.items).toHaveCount(TASKS.length);
  });

  test('RF-32: un rango «desde»-«hasta» incluye ambos días', async ({ page, freshAccount }) => {
    await createTasks(freshAccount, TASKS);
    await login(page, freshAccount);
    const history = new HistoryPage(page);
    await history.goto();
    await history.from.fill(addDays(todayKey(), 2));
    await history.to.fill(addDays(todayKey(), 5));
    await history.apply.click();
    await expect(history.items).toHaveCount(2);
    await expect(history.items.nth(0)).toContainText('Revisar el informe');
    await expect(history.items.nth(1)).toContainText('Pagar el alquiler');

    await history.to.fill(addDays(todayKey(), 2));
    await history.apply.click();
    await expect(history.items).toHaveCount(1);
    await expect(history.items).toContainText('Revisar el informe');
  });

  test('RF-34: más de 50 tareas se reparten en páginas de 50', async ({ page, freshAccount }, testInfo) => {
    const many = Array.from({ length: HISTORY_PAGE_SIZE + 1 }, (_, index) => ({
      title: `Tarea ${String(index + 1)}`,
      date: addDays(todayKey(), 1),
    }));
    await createTasks(freshAccount, many);
    await login(page, freshAccount);
    const history = new HistoryPage(page);
    await history.goto();
    await expect(history.items).toHaveCount(HISTORY_PAGE_SIZE);
    await expect(history.pagination).toContainText(`Página 1 de 2 · ${String(many.length)} tareas`);
    await expect(history.previousPage).toBeDisabled();
    await expectResponsive(page, testInfo, [history.nextPage]);

    await history.nextPage.click();
    await expect(page).toHaveURL(/\?page=2$/);
    await expect(history.items).toHaveCount(1);
    await expect(history.items).toContainText(`Tarea ${String(many.length)}`);
    await expect(history.pagination).toContainText('Página 2 de 2');

    // Una página que ya no existe lleva a la última
    await history.goto('?page=7');
    await expect(page).toHaveURL(/\?page=2$/);
    await expect(history.items).toHaveCount(1);
  });

  test('sin tareas, el historial lo indica', async ({ page, freshAccount }) => {
    await login(page, freshAccount);
    const history = new HistoryPage(page);
    await history.goto();
    await expect(page.getByText('Todavía no tienes tareas.')).toBeVisible();
  });

  // Bug del 2026-10-31 (T116): tras completar o desmarcar en el tablero, el historial ya visitado seguía con el
  // estado anterior hasta recargar la página
  test('RF-31: completar y desmarcar en el tablero se ve en el historial sin recargar', async ({
    page,
    freshAccount,
  }) => {
    await createTasks(freshAccount, [{ title: 'Llamar al banco', date: todayKey() }]);
    await login(page, freshAccount);
    const shell = new AppShell(page);
    const history = new HistoryPage(page);
    // Se visita el historial antes del cambio: su página queda en la caché
    await shell.navigateTo('Historial');
    await expect(history.items).toContainText('Pendiente');

    await shell.navigateTo('Tablero');
    const board = new BoardPage(page);
    const checkbox = board.column(todayKey()).getByRole('checkbox', { name: 'Llamar al banco' });
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('aria-disabled', 'false');
    await shell.navigateTo('Historial');
    await expect(history.items).toContainText('Completada');

    await shell.navigateTo('Tablero');
    await board.column(todayKey()).getByRole('checkbox', { name: 'Llamar al banco' }).click();
    await expect(board.column(todayKey()).getByRole('checkbox', { name: 'Llamar al banco' })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    await shell.navigateTo('Historial');
    await expect(history.items).toContainText('Pendiente');
  });
});
