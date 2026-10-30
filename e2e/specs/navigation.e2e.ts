import { addDays, todayKey } from '../../src/shared/date/day.util';
import { formatShortDate } from '../../src/shared/date/date-format.util';
import { expect, test as authTest } from '../fixtures/auth.fixture';
import { test } from '../fixtures/tasks.fixture';
import { AppShell } from '../pages/app-shell.po';
import { LoginPage } from '../pages/login.po';

const WEEK_LENGTH = 7;
const PRIVATE_ROUTES = ['/', '/history', '/alerts', '/account'];

// Pantallas de la navegación, con su ruta y su título (RF-50)
const SCREENS = [
  { link: 'Historial', path: '/history', heading: 'Historial' },
  { link: 'Avisos', path: '/alerts', heading: 'Avisos' },
  { link: 'Cuenta', path: '/account', heading: 'Cuenta' },
  { link: 'Tablero', path: '/', heading: 'Tablero' },
];

function weekRange(start: string): string {
  return `${formatShortDate(start)} – ${formatShortDate(addDays(start, WEEK_LENGTH - 1))}`;
}

authTest.describe('RF-08: sin sesión', () => {
  for (const path of PRIVATE_ROUTES) {
    authTest(`RF-08: ${path} lleva al inicio de sesión recordando a dónde volver`, async ({ page }) => {
      await page.goto(path);
      await expect(new LoginPage(page).heading).toBeVisible();
      await expect(page).toHaveURL(/\/login(\?|$)/);
      if (path !== '/') expect(new URL(page.url()).searchParams.get('returnTo')).toBe(path);
    });
  }
});

test.describe('RF-50 y RF-54: navegación con sesión', () => {
  test('RF-50: muestra el usuario, las cuatro pantallas y cerrar sesión; en móvil y tablet, dentro del menú', async ({
    page,
    board,
    freshAccount,
  }) => {
    await board.board.waitFor();
    const shell = new AppShell(page);
    const inMenu = await shell.openMenu.isVisible();
    expect(inMenu).toBe(!test.info().project.name.endsWith('-desktop'));
    await expect(await shell.displayName(freshAccount.email)).toBeVisible();
    const navigation = page.getByRole('navigation', { name: 'Navegación principal' });
    for (const { link } of SCREENS) await expect(navigation.getByRole('link', { name: link })).toBeVisible();
    await expect(shell.logoutButton).toBeVisible();
  });

  test('RF-54: cada pantalla se marca como activa en la navegación y el menú se cierra al elegirla', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    const shell = new AppShell(page);
    for (const screen of SCREENS) {
      await shell.navigateTo(screen.link);
      await expect(shell.pageHeading(screen.heading)).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`${screen.path}$`));
      // En móvil y tablet, el menú se cierra al navegar y hay que abrirlo para ver la marca
      if (await shell.openMenu.isVisible()) {
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await shell.openMenu.click();
      }
      await expect(page.getByRole('link', { name: screen.link, exact: true })).toHaveAttribute('aria-current', 'page');
      if (await page.getByRole('dialog').isVisible()) await page.keyboard.press('Escape');
    }
  });

  test('RF-12 y RF-47: semana anterior y siguiente de 7 en 7, y «Hoy» vuelve a la que empieza hoy', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    const today = todayKey();
    await expect(page.getByText(weekRange(today))).toBeVisible();
    await board.nextWeek.click();
    await expect(page.getByText(weekRange(addDays(today, WEEK_LENGTH)))).toBeVisible();
    await board.nextWeek.click();
    await expect(page.getByText(weekRange(addDays(today, 2 * WEEK_LENGTH)))).toBeVisible();
    await board.today.click();
    await expect(page.getByText(weekRange(today))).toBeVisible();
    await board.previousWeek.click();
    await expect(page.getByText(weekRange(addDays(today, -WEEK_LENGTH)))).toBeVisible();
    await expect(board.columns.first()).toHaveAccessibleName(board.columnName(addDays(today, -WEEK_LENGTH)));
  });
});
