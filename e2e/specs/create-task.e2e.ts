import type { Page } from '@playwright/test';

import { formatDayLong } from '../../src/shared/date/date-format.util';
import { addDays, todayKey } from '../../src/shared/date/day.util';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { expect, test } from '../fixtures/tasks.fixture';
import { TaskFormDialog } from '../pages/task-form.po';

const OUTSIDE_WEEK_DAYS = 10;

// RF-19: peticiones de creación que llegan a la API
function trackTaskCreations(page: Page): string[] {
  const creations: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/tasks') creations.push(request.url());
  });
  return creations;
}

test.describe('HU-03: crear una tarea', () => {
  test('RF-15 y RF-18: desde la columna de mañana, con su fecha, aparece pendiente en esa columna', async ({
    page,
    board,
  }, testInfo) => {
    const tomorrow = addDays(todayKey(), 1);
    await board.addTaskTo(tomorrow).click();
    const form = new TaskFormDialog(page);
    await expect(form.dialog).toBeVisible();
    await expect(form.date).toHaveValue(tomorrow);
    await expect(form.title).toBeFocused();
    await expectResponsive(page, testInfo);

    await form.fill({ title: 'Comprar pan', description: 'Integral' });
    await form.submit.click();

    await expect(form.dialog).toBeHidden();
    const column = board.column(tomorrow);
    await expect(column.getByRole('list', { name: 'Pendientes' })).toContainText('Comprar pan');
    await expect(column.getByText('1 tarea')).toBeVisible();
  });

  test('RF-51: «Nueva tarea» propone hoy y la tarea aparece en la columna de hoy', async ({ page, board }) => {
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await expect(form.date).toHaveValue(todayKey());
    await form.fill({ title: 'Llamar al banco' });
    await form.submit.click();
    await expect(board.column(todayKey()).getByRole('listitem')).toContainText('Llamar al banco');
  });

  test('RF-52: con fecha fuera de la semana visible confirma la creación con su fecha', async ({ page, board }) => {
    const later = addDays(todayKey(), OUTSIDE_WEEK_DAYS);
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await form.fill({ title: 'Revisar el informe', date: later });
    await form.submit.click();

    await expect(board.notice).toHaveText(`Tarea creada para el ${formatDayLong(later)}.`);
    await expect(board.board.getByText('Revisar el informe')).toHaveCount(0);
    await board.nextWeek.click();
    await expect(board.column(later).getByRole('listitem')).toContainText('Revisar el informe');
  });

  test('RF-19: un doble clic en «Crear tarea» crea una sola tarea', async ({ page, board }) => {
    const creations = trackTaskCreations(page);
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await form.fill({ title: 'Una sola vez' });
    await form.submit.dblclick();

    await expect(form.dialog).toBeHidden();
    await page.reload();
    await expect(board.column(todayKey()).getByText('Una sola vez')).toHaveCount(1);
    expect(creations).toHaveLength(1);
  });

  test('D-1: tras recargar la página se puede crear sin volver a entrar', async ({ page, board }) => {
    await page.reload();
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await form.fill({ title: 'Tras recargar' });
    await form.submit.click();
    await expect(board.column(todayKey()).getByRole('listitem')).toContainText('Tras recargar');
  });

  test('«Cancelar» cierra sin crear nada y devuelve el foco', async ({ page, board }) => {
    const creations = trackTaskCreations(page);
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await form.fill({ title: 'No se crea' });
    await form.cancel.click();
    await expect(form.dialog).toBeHidden();
    await expect(board.newTask).toBeFocused();
    expect(creations).toEqual([]);
  });
});
