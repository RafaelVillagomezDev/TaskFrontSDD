import { addDays, todayKey } from '@shared/date/day.util';
import { createTasks } from '../fixtures/api-client';
import { expect, test } from '../fixtures/tasks.fixture';
import { AppShell } from '../pages/app-shell.po';
import { TaskDayPage } from '../pages/task-day.po';

// HU-01 de la spec 002: las tareas completadas hoy, en solo lectura, en /taskday («Hecho hoy»)
test.describe('HU-01 (002): ver lo que he hecho hoy', () => {
  test('RF-01, RF-02 y RF-03: muestra solo las completadas de hoy, con su descripción y cuántas son', async ({
    page,
    board,
    freshAccount,
  }) => {
    await board.board.waitFor();
    // Una tarea con fecha pasada no se puede crear (API-001 RF-07): «otro día» es mañana
    await createTasks(freshAccount, [
      { title: 'Comprar pan', description: 'Integral', date: todayKey(), completed: true },
      { title: 'Llamar al banco', date: todayKey() },
      { title: 'Regar las plantas', date: todayKey(), completed: true },
      { title: 'Revisar el informe', date: addDays(todayKey(), 1) },
    ]);
    const taskDay = new TaskDayPage(page);
    await taskDay.goto();
    await expect(taskDay.heading).toBeVisible();
    await expect(taskDay.items).toHaveCount(2);
    await expect(taskDay.items.nth(0)).toContainText('Comprar pan');
    await expect(taskDay.items.nth(0)).toContainText('Integral');
    await expect(taskDay.items.nth(1)).toContainText('Regar las plantas');
    await expect(taskDay.list).not.toContainText('Llamar al banco');
    await expect(taskDay.list).not.toContainText('Revisar el informe');
    await expect(taskDay.pagination).toContainText('2 tareas completadas hoy');
  });

  test('RF-05: las tareas son de solo lectura', async ({ page, board, freshAccount }) => {
    await board.board.waitFor();
    await createTasks(freshAccount, [{ title: 'Comprar pan', date: todayKey(), completed: true }]);
    const taskDay = new TaskDayPage(page);
    await taskDay.goto();
    await expect(taskDay.items).toHaveCount(1);
    await expect(taskDay.list.getByRole('checkbox')).toHaveCount(0);
    await expect(taskDay.list.getByRole('button')).toHaveCount(0);
  });

  test('RF-04: sin tareas completadas hoy muestra el estado vacío y lleva al tablero', async ({ page, board }) => {
    await board.board.waitFor();
    const taskDay = new TaskDayPage(page);
    await taskDay.goto();
    await expect(taskDay.empty).toBeVisible();
    await taskDay.goToBoard.click();
    await expect(board.board).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test('RF-06 y RF-08: completar en el tablero y abrir «Hecho hoy» desde la navegación la muestra sin recargar; al desmarcarla desaparece', async ({
    page,
    board,
    freshAccount,
  }) => {
    await createTasks(freshAccount, [{ title: 'Comprar pan', date: todayKey() }]);
    await page.reload();
    const today = board.column(todayKey());
    const shell = new AppShell(page);
    const taskDay = new TaskDayPage(page);

    await today.getByRole('checkbox', { name: 'Comprar pan' }).click();
    await expect(today.getByRole('checkbox', { name: 'Comprar pan' })).toBeChecked();
    await shell.navigateTo('Hecho hoy');
    await expect(taskDay.heading).toBeVisible();
    await expect(taskDay.items).toHaveCount(1);
    await expect(taskDay.items.first()).toContainText('Comprar pan');

    await shell.navigateTo('Tablero');
    await today.getByRole('checkbox', { name: 'Comprar pan' }).click();
    await expect(today.getByRole('checkbox', { name: 'Comprar pan' })).not.toBeChecked();
    await shell.navigateTo('Hecho hoy');
    await expect(taskDay.empty).toBeVisible();
  });
});
