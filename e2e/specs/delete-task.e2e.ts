import type { Page } from '@playwright/test';

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

const STREAK_DELAY_MS = 800;
const AT_RISK = 'Tu racha está en juego';

// Registra si el aviso de racha en juego aparece en algún momento, aunque sea un instante (un parpadeo)
async function watchAtRisk(page: Page): Promise<() => Promise<boolean>> {
  await page.evaluate((text) => {
    const seen = { value: false };
    Object.assign(window, { atRiskSeen: seen });
    new MutationObserver(() => {
      if (document.body.textContent.includes(text)) seen.value = true;
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }, AT_RISK);
  return () =>
    page.evaluate(() => {
      const seen: unknown = Reflect.get(window, 'atRiskSeen');
      return typeof seen === 'object' && seen !== null && Reflect.get(seen, 'value') === true;
    });
}

// Bug reportado el 2026-10-30 (spec, Clarificaciones): dos tareas de hoy completadas y después eliminadas.
// Mientras la API recalcula la racha, el panel parpadeaba «Tu racha está en juego» con la racha anterior
test.describe('RF-27: racha al quitar las tareas completadas de hoy', () => {
  test('RF-27: eliminar las dos tareas completadas de hoy no hace parpadear «racha en juego»', async ({
    page,
    freshAccount,
  }) => {
    await createTasks(freshAccount, [
      { title: 'Comprar pan', date: todayKey(), completed: true },
      { title: 'Llamar al banco', date: todayKey(), completed: true },
    ]);
    const login = new LoginPage(page);
    await login.goto();
    await login.login(freshAccount);
    const board = new BoardPage(page);
    await expect(board.streakPanel).toContainText(/Racha actual\s*1 día/);
    await expect(board.streakPanel).toContainText('2 de 2 tareas completadas');

    // La racha se calcula en la API en su momento, pero su respuesta tarda en llegar, como en una red lenta
    await page.route(
      (url) => url.port === '3000' && url.pathname === '/streak',
      async (route) => {
        const response = await route.fetch();
        await new Promise((resolve) => setTimeout(resolve, STREAK_DELAY_MS));
        await route.fulfill({ response });
      },
    );
    const sawAtRisk = await watchAtRisk(page);

    for (const title of ['Comprar pan', 'Llamar al banco']) {
      await board
        .column(todayKey())
        .getByRole('button', { name: `Eliminar «${title}»` })
        .click();
      await page.getByRole('dialog', { name: '¿Eliminar la tarea?' }).getByRole('button', { name: 'Eliminar' }).click();
      await expect(board.column(todayKey()).getByText(title)).toHaveCount(0);
    }
    await expect(board.streakPanel).toContainText('Sin tareas hoy');
    await expect(board.streakPanel).toContainText(/Racha actual\s*0 días/);
    expect(await sawAtRisk()).toBe(false);
  });
});
