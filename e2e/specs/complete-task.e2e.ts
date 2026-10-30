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
