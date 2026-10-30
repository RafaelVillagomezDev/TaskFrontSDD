import type { Page, Route } from '@playwright/test';

import { todayKey } from '../../src/shared/date/day.util';
import { expect, test } from '../fixtures/tasks.fixture';
import { BoardPage } from '../pages/board.po';
import { LoginPage } from '../pages/login.po';
import { TaskFormDialog } from '../pages/task-form.po';

const API_PORT = '3000';
const CLOCK_SKEW_MS = 6 * 60 * 1000;
const RETRY = 'Reintentar';

// Peticiones a una ruta de la API (no a los módulos de Vite, que también contienen «tasks» en su ruta)
function apiPath(path: string): (url: URL) => boolean {
  return (url) => url.port === API_PORT && url.pathname === path;
}

function failWith(status: number, code: string): (route: Route) => Promise<void> {
  return (route) =>
    route.fulfill({ status, json: { success: false, status, error: { code, message: 'texto técnico de la API' } } });
}

// Pantallas con una consulta propia: sin conexión muestran el error en su zona y «Reintentar» la repite
const SCREENS: { name: string; path: string; apiPath: string; ready: (page: Page) => Promise<void> }[] = [
  {
    name: 'tablero',
    path: '/',
    apiPath: '/tasks',
    ready: (page) => expect(new BoardPage(page).board).toBeVisible(),
  },
  {
    name: 'historial',
    path: '/history',
    apiPath: '/tasks',
    ready: (page) => expect(page.getByText('Todavía no tienes tareas.')).toBeVisible(),
  },
  {
    name: 'avisos',
    path: '/alerts',
    apiPath: '/alerts',
    ready: (page) => expect(page.getByText('Todavía no tienes avisos.')).toBeVisible(),
  },
];

test.describe('RF-40 a RF-44: errores y estados comunes', () => {
  for (const screen of SCREENS) {
    test(`RF-44: sin conexión, el ${screen.name} muestra el error con «${RETRY}» y al reintentar carga`, async ({
      page,
      board,
    }) => {
      await board.board.waitFor();
      // unroute necesita la misma función que route
      const isScreenQuery = apiPath(screen.apiPath);
      await page.route(isScreenQuery, (route) => route.abort('connectionrefused'));
      await page.goto(screen.path);
      const error = page.getByRole('alert').filter({ hasText: 'No hay conexión con el servidor.' }).first();
      await expect(error).toBeVisible();
      await page.unroute(isScreenQuery);
      await error.getByRole('button', { name: RETRY }).click();
      await screen.ready(page);
    });
  }

  test('RF-40: mientras carga el tablero, el indicador va en su zona y el resto de la pantalla se puede usar', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(apiPath('/tasks'), async (route) => {
      await held;
      await route.continue();
    });
    await page.reload();
    await expect(page.getByRole('status', { name: 'Cargando…' }).first()).toBeVisible();
    await expect(board.board).toHaveCount(0);
    // La cabecera responde: «Nueva tarea» abre su formulario aunque el tablero no haya llegado
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await expect(form.dialog).toBeVisible();
    await form.cancel.click();
    release();
    await expect(board.board).toBeVisible();
  });

  test('RF-41: un fallo inesperado muestra el mensaje propio, nunca el código ni el texto de la API', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    await page.route(apiPath('/streak'), failWith(500, 'INTERNAL_ERROR'));
    await page.reload();
    const error = board.streakPanel.getByRole('alert');
    await expect(error).toHaveText(/Algo ha fallado\. Inténtalo de nuevo en unos segundos\./);
    await expect(page.getByText('INTERNAL_ERROR')).toHaveCount(0);
    await expect(page.getByText('texto técnico de la API')).toHaveCount(0);
  });

  test('RF-41: si crear una tarea falla, el formulario conserva lo escrito y explica el error', async ({
    page,
    board,
  }) => {
    await board.board.waitFor();
    await page.route(apiPath('/tasks'), async (route) => {
      if (route.request().method() === 'POST') await failWith(500, 'INTERNAL_ERROR')(route);
      else await route.continue();
    });
    await board.newTask.click();
    const form = new TaskFormDialog(page);
    await form.fill({ title: 'Comprar pan', description: 'Integral' });
    await form.submit.click();
    await expect(form.error).toContainText('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    await expect(form.title).toHaveValue('Comprar pan');
    await expect(form.description).toHaveValue('Integral');
    await expect(form.date).toHaveValue(todayKey());
  });

  test('RF-43: con el reloj del dispositivo desviado 6 minutos pide revisar la fecha, la hora y la zona', async ({
    page,
    freshAccount,
  }) => {
    await page.clock.install({ time: new Date(Date.now() + CLOCK_SKEW_MS) });
    const login = new LoginPage(page);
    await login.goto();
    await login.login(freshAccount);
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'La hora de tu dispositivo no es correcta. Revisa la fecha, la hora y la zona horaria.' })
        .first(),
    ).toBeVisible();
  });
});
