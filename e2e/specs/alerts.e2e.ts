import { expect, test } from '../fixtures/tasks.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';
import { AlertsPage } from '../pages/alerts.po';
import { AppShell } from '../pages/app-shell.po';

// Los avisos los genera la API a las 22:00 y no se pueden crear desde la interfaz: aquí se prueban la navegación y
// el estado vacío; el contenido, con datos fijos en los tests de componentes y hooks (tasks.md, fase H9)
test.describe('HU-09: ver mis avisos', () => {
  test('RF-35: desde la navegación, una cuenta nueva ve el estado vacío', async ({ page, board }, testInfo) => {
    await board.board.waitFor();
    await new AppShell(page).navigateTo('Avisos');
    const alerts = new AlertsPage(page);
    await expect(alerts.heading).toBeVisible();
    await expect(page).toHaveURL(/\/alerts$/);
    await expect(alerts.empty).toBeVisible();
    await expect(page.getByText(/A las 22:00/)).toBeVisible();
    await expect(alerts.list).toHaveCount(0);
    await expectResponsive(page, testInfo);
  });

  test('RF-37: sin avisos de hoy, el tablero no destaca ninguno', async ({ page, board }) => {
    await expect(board.streakPanel).toBeVisible();
    await expect(page.getByRole('region', { name: 'Aviso de hoy' })).toHaveCount(0);
  });

  test('D-8: una página que no existe en la URL muestra el estado vacío', async ({ page, board }) => {
    await board.board.waitFor();
    const alerts = new AlertsPage(page);
    await page.goto('/alerts?page=4');
    await expect(alerts.empty).toBeVisible();
  });
});
