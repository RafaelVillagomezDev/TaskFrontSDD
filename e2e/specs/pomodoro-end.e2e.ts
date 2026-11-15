import { expect, test } from '../fixtures/pomodoro.fixture';
import { PomodoroAchievementsPage } from '../pages/pomodoro-achievements.po';

// El único test que espera una sesión real (003 plan R-4): la API decide el fin con su reloj (API-004 RNF-02), así
// que no se puede acelerar. Comprueba de una vez todo lo que pasa al terminar por tiempo con la página abierta
test('RF-15 a RF-19, RF-27, RF-41, RF-43, RF-57, RF-59, RF-66, RF-68, RF-71 y RF-72: una sesión de 1 minuto termina por tiempo', async ({
  pomodoro,
}) => {
  test.setTimeout(120_000);
  const page = pomodoro.startForm.page();
  await pomodoro.addNewTask({ title: 'Repasar' });
  await pomodoro.chooseDuration('Otra');
  await pomodoro.customMinutes.fill('1');
  await pomodoro.submit.click();
  await expect(pomodoro.clock).toBeVisible();
  await expect(page).toHaveTitle(/^00:\d{2} · Pomodoro$/);

  await expect(pomodoro.result).toBeVisible({ timeout: 90_000 });

  await expect(pomodoro.result).toContainText('Terminada por tiempo');
  await expect(pomodoro.result).toContainText('0 de 1 tareas hechas');
  await expect(page).toHaveTitle('¡Sesión terminada! · Pomodoro');
  await expect(pomodoro.announcement('La sesión ha terminado.')).toHaveCount(1);
  await expect(page).toHaveURL(/\?result=/);
  // Fase 2 (RF-68): el resultado avisa del primer logro, dentro del mismo y único test de 1 minuto (R-4)
  await expect(pomodoro.newAchievements).toContainText('Primer pomodoro');
  await expect(pomodoro.result.getByRole('link', { name: 'Ver mis logros' })).toBeVisible();

  await page.reload();
  await expect(pomodoro.result).toContainText('Terminada por tiempo');
  await pomodoro.startAnother.click();
  await expect(pomodoro.startForm).toBeVisible();

  // RF-41 y RF-43: «Logros» lo muestra conseguido y la racha del pomodoro es 1
  await page.getByRole('navigation', { name: 'Secciones del pomodoro' }).getByRole('link', { name: 'Logros' }).click();
  const achievements = new PomodoroAchievementsPage(page);
  await expect(achievements.card('Primer pomodoro')).toContainText('Conseguido');
  await expect(achievements.streakValues()).toHaveText(['1 día', '1 día']);
});
