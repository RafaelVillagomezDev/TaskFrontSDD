import { todayKey } from '@shared/date/day.util';
import { completePomodoroTaskInPage, finishPomodoroInPage, startPomodoroInPage } from '../fixtures/api-client';
import { expect, test } from '../fixtures/session.fixture';
import { PomodoroHistoryPage } from '../pages/pomodoro-history.po';

test.describe('HU-06 (003): consultar mis sesiones pasadas', () => {
  test('RF-38 a RF-40 y RF-54: las sesiones van de la más reciente a la más antigua y el detalle muestra sus tareas', async ({
    signedInPage: page,
  }) => {
    // Tres sesiones terminadas a mano por API (plan §7); la de en medio con una tarea completada y otra pendiente
    await finishPomodoroInPage(page, await startPomodoroInPage(page, { durationMinutes: 15 }));
    const middle = await startPomodoroInPage(page, {
      durationMinutes: 25,
      newTasks: [
        { title: 'Leer el capítulo', date: todayKey() },
        { title: 'Hacer resúmenes', date: todayKey() },
      ],
    });
    await completePomodoroTaskInPage(page, middle, 'Leer el capítulo');
    await finishPomodoroInPage(page, middle);
    await finishPomodoroInPage(page, await startPomodoroInPage(page, { durationMinutes: 45 }));

    const history = new PomodoroHistoryPage(page);
    await history.goto();
    await expect(history.items).toHaveCount(3);
    await expect(history.items).toContainText(['Sesión de 45 min', 'Sesión de 25 min', 'Sesión de 15 min']);
    await expect(history.items.nth(1)).toContainText('Terminada a mano');
    await expect(history.items.nth(1)).toContainText('1 de 2 tareas hechas');

    await history.openSession(1).click();
    await expect(page).toHaveURL(`/pomodoro/history/${middle}`);
    await expect(history.detailTasks.getByRole('listitem')).toHaveText([
      'Completada: Leer el capítulo',
      'Pendiente: Hacer resúmenes',
    ]);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    const subNavigation = page.getByRole('navigation', { name: 'Secciones del pomodoro' });
    await expect(subNavigation.getByRole('link', { name: 'Historial' })).toHaveAttribute('aria-current', 'page');

    await history.backToHistory.click();
    await expect(history.items).toHaveCount(3);
  });

  test('sin sesiones muestra el estado vacío con acceso a empezar una', async ({ signedInPage: page }) => {
    const history = new PomodoroHistoryPage(page);
    await history.goto();
    await expect(history.empty).toBeVisible();
    await page.getByRole('link', { name: 'Empezar una sesión' }).click();
    await expect(page).toHaveURL('/pomodoro');
  });

  test('RF-49: una sesión que no existe muestra que no se encuentra y lleva al pomodoro', async ({
    signedInPage: page,
  }) => {
    const history = new PomodoroHistoryPage(page);
    await history.gotoSession(crypto.randomUUID());
    await expect(history.notFound).toBeVisible();
    await history.goToPomodoro.click();
    await expect(page).toHaveURL('/pomodoro');
  });
});
