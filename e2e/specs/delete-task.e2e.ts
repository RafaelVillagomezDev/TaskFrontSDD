import { addDays, todayKey } from '../../src/shared/date/day.util';
import { createTasks } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { BoardPage } from '../pages/board.po';
import { LoginPage } from '../pages/login.po';

test.describe('HU-05: eliminar una tarea', () => {
  test.beforeEach(async ({ page, freshAccount }) => {
    await createTasks(freshAccount, [
      { title: 'Comprar pan', date: todayKey() },
      { title: 'Revisar el informe', date: addDays(todayKey(), 2) },
    ]);
    const login = new LoginPage(page);
    await login.goto();
    await login.login(freshAccount);
    await new BoardPage(page).board.waitFor();
  });

  test('RF-23 y RF-24: eliminar pide confirmación con el título y, al confirmar, la tarea desaparece', async ({
    page,
  }, testInfo) => {
    const board = new BoardPage(page);
    await board.column(todayKey()).getByRole('button', { name: 'Eliminar «Comprar pan»' }).click();
    const dialog = page.getByRole('dialog', { name: '¿Eliminar la tarea?' });
    await expect(dialog).toContainText('«Comprar pan» desaparecerá del tablero y del historial. No se puede deshacer.');
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await expectResponsive(page, testInfo);

    await dialog.getByRole('button', { name: 'Eliminar' }).click();
    await expect(dialog).toBeHidden();
    await expect(board.column(todayKey()).getByText('Comprar pan')).toHaveCount(0);
    await expect(board.column(todayKey()).getByText('Sin tareas')).toBeVisible();

    // Se eliminó en la API, no solo en la vista
    await page.reload();
    await expect(board.column(todayKey()).getByText('Sin tareas')).toBeVisible();
  });

  test('RF-23: cancelar deja la tarea igual', async ({ page }) => {
    const board = new BoardPage(page);
    const later = board.column(addDays(todayKey(), 2));
    await later.getByRole('button', { name: 'Eliminar «Revisar el informe»' }).click();
    const dialog = page.getByRole('dialog', { name: '¿Eliminar la tarea?' });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(later.getByText('Revisar el informe')).toBeVisible();
  });

  test('solo con teclado: abrir la confirmación, cancelar con Escape y eliminar con Enter', async ({ page }) => {
    const board = new BoardPage(page);
    const trash = board.column(todayKey()).getByRole('button', { name: 'Eliminar «Comprar pan»' });
    const dialog = page.getByRole('dialog', { name: '¿Eliminar la tarea?' });
    await trash.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trash).toBeFocused();

    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Eliminar' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(board.column(todayKey()).getByText('Comprar pan')).toHaveCount(0);
  });
});
