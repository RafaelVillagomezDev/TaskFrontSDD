import type { Page } from '@playwright/test';

import { addDays, todayKey } from '../../src/shared/date/day.util';
import { createTasks, type Account } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { BoardPage } from '../pages/board.po';
import { LoginPage } from '../pages/login.po';

const WEEK_LENGTH = 7;
const IN_THREE_DAYS = 3;

// Entra con la cuenta del test y espera al tablero
async function openBoard(page: Page, account: Account): Promise<BoardPage> {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(account);
  const board = new BoardPage(page);
  await board.board.waitFor();
  return board;
}

test.describe('HU-02: ver las tareas de mi semana', () => {
  test('RF-09 y RF-11: sin tareas, 7 columnas vacías desde hoy', async ({ page, freshAccount }, testInfo) => {
    const board = await openBoard(page, freshAccount);
    await expect(board.columns).toHaveCount(WEEK_LENGTH);
    await expect(board.columns.first()).toHaveAccessibleName(board.columnName(todayKey()));
    await expect(board.columns.last()).toHaveAccessibleName(board.columnName(addDays(todayKey(), WEEK_LENGTH - 1)));
    await expect(board.board.getByText('Sin tareas')).toHaveCount(WEEK_LENGTH);
    await expectResponsive(page, testInfo);
  });

  test('RF-09 y RF-10: cada tarea en la columna de su día, pendientes y completadas por separado', async ({
    page,
    freshAccount,
  }, testInfo) => {
    const today = todayKey();
    const later = addDays(today, IN_THREE_DAYS);
    await createTasks(freshAccount, [
      { title: 'Comprar pan', date: today },
      { title: 'Llamar al banco', date: today, completed: true },
      { title: 'Revisar el informe', date: later },
    ]);
    const board = await openBoard(page, freshAccount);

    const todayColumn = board.column(today);
    await expect(todayColumn.getByText('2 tareas')).toBeVisible();
    await expect(todayColumn.getByRole('list', { name: 'Pendientes' })).toContainText('Comprar pan');
    await expect(todayColumn.getByRole('list', { name: 'Completadas' })).toContainText('Llamar al banco');
    await expect(board.column(later).getByRole('listitem')).toHaveText(/Revisar el informe/);
    await expect(board.column(addDays(today, 1)).getByText('Sin tareas')).toBeVisible();
    await expectResponsive(page, testInfo);
  });

  test('RF-12, RF-13 y RF-47: la semana anterior es de solo lectura y «Hoy» vuelve a la actual', async ({
    page,
    freshAccount,
  }, testInfo) => {
    const board = await openBoard(page, freshAccount);
    await board.previousWeek.click();
    await expect(board.columns.first()).toHaveAccessibleName(board.columnName(addDays(todayKey(), -WEEK_LENGTH)));
    await expect(board.board.getByText('Día cerrado')).toHaveCount(WEEK_LENGTH);
    await expectResponsive(page, testInfo);

    await board.today.click();
    await board.nextWeek.click();
    await expect(board.columns.first()).toHaveAccessibleName(board.columnName(addDays(todayKey(), WEEK_LENGTH)));
    await expect(board.board.getByText('Día cerrado')).toHaveCount(0);

    await board.today.click();
    await expect(board.columns.first()).toHaveAccessibleName(board.columnName(todayKey()));
  });

  test('RNF-02 y RNF-03: el tablero se desplaza solo dentro de su zona, también con teclado', async ({
    page,
    freshAccount,
  }) => {
    const board = await openBoard(page, freshAccount);
    await board.nextWeek.focus();
    await page.keyboard.press('Tab');
    await expect(board.board).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => board.board.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
