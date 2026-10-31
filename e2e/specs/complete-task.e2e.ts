import type { Page } from '@playwright/test';

import { addDays, todayKey } from '../../src/shared/date/day.util';
import { createTasks } from '../fixtures/api-client';
import { expect, test } from '../fixtures/auth.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { BoardPage } from '../pages/board.po';
import { LoginPage } from '../pages/login.po';

test.describe('HU-04: completar y desmarcar tareas', () => {
  test.beforeEach(async ({ page, freshAccount }) => {
    await createTasks(freshAccount, [
      { title: 'Comprar pan', date: todayKey() },
      { title: 'Revisar el informe', date: addDays(todayKey(), 1) },
    ]);
    const login = new LoginPage(page);
    await login.goto();
    await login.login(freshAccount);
    await new BoardPage(page).board.waitFor();
  });

  test('RF-20 y RF-21: completar una tarea de hoy la marca completada y desmarcarla la devuelve a pendiente', async ({
    page,
  }, testInfo) => {
    const today = new BoardPage(page).column(todayKey());
    const checkbox = today.getByRole('checkbox', { name: 'Comprar pan' });
    await expect(checkbox).not.toBeChecked();
    await expectResponsive(page, testInfo, [checkbox]);

    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect(today.getByRole('list', { name: 'Completadas' })).toContainText('Comprar pan');

    // El cambio quedó guardado en la API
    await page.reload();
    await expect(today.getByRole('checkbox', { name: 'Comprar pan' })).toBeChecked();

    await today.getByRole('checkbox', { name: 'Comprar pan' }).click();
    await expect(today.getByRole('list', { name: 'Pendientes' })).toContainText('Comprar pan');
    await page.reload();
    await expect(today.getByRole('checkbox', { name: 'Comprar pan' })).not.toBeChecked();
  });

  test('RF-25, RF-26 y CE-02: completar la única tarea de hoy sube la racha y cambia «0 de 1» a «1 de 1»', async ({
    page,
  }, testInfo) => {
    const board = new BoardPage(page);
    // Cuenta nueva: racha 0 y ninguna tarea completada todavía
    await expect(board.streakPanel).toContainText(/Racha actual\s*0 días/);
    await expect(board.streakPanel).toContainText(/Mejor racha\s*0 días/);
    await expect(board.streakPanel).toContainText('0 de 1 tareas completadas');
    await expectResponsive(page, testInfo, [board.streakPanel]);

    await board.column(todayKey()).getByRole('checkbox', { name: 'Comprar pan' }).click();
    // Sin recargar la página
    await expect(board.streakPanel).toContainText('1 de 1 tareas completadas');
    await expect(board.streakPanel).toContainText(/Racha actual\s*1 día/);
    await expect(board.streakPanel).toContainText(/Mejor racha\s*1 día/);
  });

  test('RF-22: la tarea de mañana no ofrece completarla', async ({ page }) => {
    const tomorrow = new BoardPage(page).column(addDays(todayKey(), 1));
    await expect(tomorrow.getByText('Revisar el informe')).toBeVisible();
    await expect(tomorrow.getByRole('checkbox')).toHaveCount(0);
  });

  test('solo con teclado: la casilla se marca y se desmarca con la barra espaciadora', async ({ page }) => {
    const today = new BoardPage(page).column(todayKey());
    const checkbox = today.getByRole('checkbox', { name: 'Comprar pan' });
    await checkbox.focus();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    // Mientras se guarda, el segundo cambio se descarta: se espera a que termine, sin perder el foco
    await expect(checkbox).toHaveAttribute('aria-disabled', 'false');
    await expect(checkbox).toBeFocused();
    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
  });
});

const PATCH_DELAY_MS = 800;
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

// Bug del 2026-10-30 (T115): al desmarcar, la casilla cambia al momento, pero la racha no se recalcula hasta
// que la API guarda el cambio; en ese tiempo el panel avisaba con la racha anterior
test.describe('RF-27: racha al desmarcar las tareas completadas de hoy', () => {
  test('RF-27: desmarcar las dos tareas completadas de hoy no hace parpadear «racha en juego»', async ({
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

    // Guardar en la API tarda, como en una red lenta
    await page.route(
      (url) => url.port === '3000' && url.pathname.startsWith('/tasks/'),
      async (route) => {
        const response = await route.fetch();
        await new Promise((resolve) => setTimeout(resolve, PATCH_DELAY_MS));
        await route.fulfill({ response });
      },
    );
    const sawAtRisk = await watchAtRisk(page);

    const today = board.column(todayKey());
    for (const title of ['Comprar pan', 'Llamar al banco']) {
      const checkbox = today.getByRole('checkbox', { name: title });
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
      await expect(checkbox).toHaveAttribute('aria-disabled', 'false');
    }
    await expect(board.streakPanel).toContainText('0 de 2 tareas completadas');
    await expect(board.streakPanel).toContainText(/Racha actual\s*0 días/);
    expect(await sawAtRisk()).toBe(false);
  });
});
