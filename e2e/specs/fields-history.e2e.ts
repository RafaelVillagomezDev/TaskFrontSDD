import type { Locator, Page } from '@playwright/test';

import { addDays, todayKey } from '../../src/shared/date/day.util';
import { createTasks } from '../fixtures/api-client';
import { expect, test } from '../fixtures/tasks.fixture';
import { HistoryPage } from '../pages/history.po';

// RF-33: un filtro no válido nunca llega a la API
function trackHistoryQueries(page: Page): string[] {
  const queries: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.pathname === '/tasks' && url.searchParams.has('status')) {
      queries.push(url.search);
    }
  });
  return queries;
}

async function expectFieldError(field: Locator, message: string): Promise<void> {
  await expect(field).toHaveAccessibleDescription(message);
  await expect(field).toHaveAttribute('aria-invalid', 'true');
}

test.describe('RF-46: campos de los filtros del historial', () => {
  test.beforeEach(async ({ page, freshAccount, board }) => {
    await createTasks(freshAccount, [
      { title: 'Comprar pan', date: todayKey() },
      { title: 'Revisar el informe', date: addDays(todayKey(), 1) },
    ]);
    await board.board.waitFor();
    const history = new HistoryPage(page);
    await history.goto();
    await expect(history.items).toHaveCount(2);
  });

  test('RF-32: «desde» y «hasta» válidos filtran', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.from.fill(todayKey());
    await history.to.fill(todayKey());
    await history.apply.click();
    await expect(history.items).toHaveCount(1);
    await expect(history.from).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('RF-32: «desde» solo, sin «hasta», filtra desde ese día', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.from.fill(addDays(todayKey(), 1));
    await history.apply.click();
    await expect(history.items).toHaveCount(1);
    await expect(history.items).toContainText('Revisar el informe');
  });

  test('RF-33: «desde» posterior a «hasta» → ««Desde» no puede ser posterior a «Hasta».» sin llamar a la API', async ({
    page,
  }) => {
    const queries = trackHistoryQueries(page);
    const history = new HistoryPage(page);
    await history.from.fill(addDays(todayKey(), 1));
    await history.to.fill(todayKey());
    await history.apply.click();
    await expectFieldError(history.from, '«Desde» no puede ser posterior a «Hasta».');
    await expect(history.items).toHaveCount(2);
    expect(queries).toEqual([]);
    await expect(page).toHaveURL(/\/history$/);
  });

  test('solo con teclado: estado con las flechas y Enter en «Filtrar»', async ({ page }) => {
    const history = new HistoryPage(page);
    await history.status.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(history.status).toHaveValue('pending');
    await page.keyboard.press('Tab');
    await expect(history.from).toBeFocused();
    await history.apply.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\?status=pending$/);
    await expect(history.items).toHaveCount(2);
  });
});
