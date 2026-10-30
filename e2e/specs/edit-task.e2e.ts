import { addDays, todayKey } from '../../src/shared/date/day.util';
import { createTasks } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { BoardPage } from '../pages/board.po';
import { LoginPage } from '../pages/login.po';
import { TaskFormDialog } from '../pages/task-form.po';

test.describe('HU-07: editar una tarea', () => {
  test.beforeEach(async ({ page, freshAccount }) => {
    await createTasks(freshAccount, [
      { title: 'Comprar pan', date: todayKey() },
      { title: 'Revisar el informe', description: 'Capítulo 2', date: addDays(todayKey(), 2) },
    ]);
    const login = new LoginPage(page);
    await login.goto();
    await login.login(freshAccount);
    await new BoardPage(page).board.waitFor();
  });

  test('RF-29 y RF-30: cambiar el título lo muestra actualizado en el tablero, sin ofrecer cambiar la fecha', async ({
    page,
  }, testInfo) => {
    const board = new BoardPage(page);
    const today = board.column(todayKey());
    await today.getByRole('button', { name: 'Editar «Comprar pan»' }).click();
    const form = new TaskFormDialog(page, 'Editar tarea');
    await expect(form.title).toHaveValue('Comprar pan');
    await expect(form.date).toHaveCount(0);
    await expectResponsive(page, testInfo);

    await form.title.fill('Comprar pan integral');
    await form.submit.click();
    await expect(form.dialog).toBeHidden();
    await expect(today.getByText('Comprar pan integral')).toBeVisible();

    // Se guardó en la API, no solo en la vista
    await page.reload();
    await expect(today.getByText('Comprar pan integral')).toBeVisible();
  });

  test('RF-29 y RF-30: en una tarea futura cambia la descripción', async ({ page }) => {
    const later = new BoardPage(page).column(addDays(todayKey(), 2));
    await later.getByRole('button', { name: 'Editar «Revisar el informe»' }).click();
    const form = new TaskFormDialog(page, 'Editar tarea');
    await expect(form.description).toHaveValue('Capítulo 2');
    await form.description.fill('Capítulos 2 y 3');
    await form.submit.click();
    await expect(form.dialog).toBeHidden();
    await expect(later.getByText('Capítulos 2 y 3')).toBeVisible();
  });

  test('RF-13: una tarea de un día pasado no ofrece editarla', async ({ page }) => {
    const board = new BoardPage(page);
    await board.previousWeek.click();
    await expect(board.board.getByText('Día cerrado')).toHaveCount(7);
    await expect(board.board.getByRole('button', { name: /^Editar/ })).toHaveCount(0);
  });

  test('«Cancelar» cierra sin guardar y devuelve el foco al botón de editar', async ({ page }) => {
    const edit = new BoardPage(page).column(todayKey()).getByRole('button', { name: 'Editar «Comprar pan»' });
    await edit.click();
    const form = new TaskFormDialog(page, 'Editar tarea');
    await form.title.fill('No se guarda');
    await form.cancel.click();
    await expect(form.dialog).toBeHidden();
    await expect(edit).toBeFocused();
    await page.reload();
    await expect(edit).toBeVisible();
  });
});
