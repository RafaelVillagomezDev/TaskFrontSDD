import type { Locator, Page } from '@playwright/test';

import { addDays, todayKey } from '../../src/shared/date/day.util';
import { expect, test } from '../fixtures/tasks.fixture';
import { TaskFormDialog } from '../pages/task-form.po';

// RF-02: los errores de validación nunca llegan a la API
function trackTaskCreations(page: Page): string[] {
  const creations: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/tasks') creations.push(request.url());
  });
  return creations;
}

async function expectFieldError(field: Locator, message: string): Promise<void> {
  await expect(field).toHaveAccessibleDescription(new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await expect(field).toHaveAttribute('aria-invalid', 'true');
}

test.describe('RF-46: campos de crear tarea', () => {
  const cases: { field: 'title' | 'description' | 'date'; value: string; message: string }[] = [
    { field: 'title', value: '', message: 'Escribe un título.' },
    { field: 'title', value: '    ', message: 'Escribe un título.' },
    { field: 'title', value: 't'.repeat(201), message: 'El título no puede tener más de 200 caracteres.' },
    { field: 'description', value: 'd'.repeat(1001), message: 'La descripción no puede tener más de 1000 caracteres.' },
    { field: 'date', value: '', message: 'Elige una fecha.' },
    { field: 'date', value: addDays(todayKey(), -1), message: 'Elige hoy o un día posterior.' },
  ];

  for (const { field, value, message } of cases) {
    test(`RF-02: ${field} «${value.length > 20 ? `${String(value.length)} caracteres` : value}» → «${message}» sin llamar a la API`, async ({
      page,
      board,
    }) => {
      const creations = trackTaskCreations(page);
      await board.newTask.click();
      const form = new TaskFormDialog(page);
      const valid = { title: 'Comprar pan', description: '', date: todayKey() };
      await form.fill({ ...valid, [field]: value });
      await form.submit.click();

      await expectFieldError(form[field], message);
      await expect(form.dialog).toBeVisible();
      expect(creations).toEqual([]);
    });
  }

  test('RF-17 y RF-46: título de 200 y descripción de 1000 caracteres, con sus contadores, crean la tarea', async ({
    page,
    board,
  }) => {
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await expect(form.title).toHaveAccessibleDescription('0/200 caracteres');
    await expect(form.description).toHaveAccessibleDescription('0/1000 caracteres');
    await form.fill({ title: ` ${'t'.repeat(200)} `, description: 'd'.repeat(1000) });
    await expect(form.title).toHaveAccessibleDescription('200/200 caracteres');
    await expect(form.description).toHaveAccessibleDescription('1000/1000 caracteres');
    await form.submit.click();

    await expect(form.dialog).toBeHidden();
    await expect(board.column(todayKey()).getByRole('listitem')).toHaveCount(1);
  });

  test('RF-16: el selector de fecha no ofrece días pasados', async ({ page, board }) => {
    await board.newTask.click();
    await expect(new TaskFormDialog(page).date).toHaveAttribute('min', todayKey());
  });

  test('solo con teclado: abrir, rellenar, crear con Enter y cerrar con Escape', async ({ page, board }) => {
    const form = new TaskFormDialog(page);
    await board.newTask.focus();
    await page.keyboard.press('Enter');
    await expect(form.title).toBeFocused();
    await page.keyboard.type('Con teclado');
    await page.keyboard.press('Tab');
    await expect(form.description).toBeFocused();
    await page.keyboard.type('Sin ratón');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(form.dialog).toBeHidden();
    await expect(board.column(todayKey()).getByRole('listitem')).toContainText('Con teclado');

    await board.newTask.focus();
    await page.keyboard.press('Enter');
    await expect(form.dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(form.dialog).toBeHidden();
    await expect(board.newTask).toBeFocused();
  });
});
