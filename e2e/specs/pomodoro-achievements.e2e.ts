import { expect, test } from '../fixtures/session.fixture';
import { PomodoroAchievementsPage } from '../pages/pomodoro-achievements.po';

const CATALOG = [
  'Primer pomodoro',
  'Concentrado',
  'Dedicado',
  'Maestro',
  'Constante',
  'Imparable',
  'Hábito',
  'Maratón',
  'Cumplidor',
  'Productivo',
  'Diez horas',
];

test.describe('HU-07 (003): ver mi racha y mis logros del pomodoro', () => {
  test('RF-41 a RF-44: sin actividad, racha 0 y los 11 logros sin conseguir con su progreso', async ({
    signedInPage: page,
  }) => {
    const achievements = new PomodoroAchievementsPage(page);
    await achievements.goto();

    await expect(achievements.streakValues()).toHaveText(['0 días', '0 días']);
    await expect(achievements.cards.getByRole('heading')).toHaveText(CATALOG);
    await expect(achievements.list.getByRole('progressbar')).toHaveCount(11);
    await expect(achievements.list.getByText('Conseguido', { exact: true })).toHaveCount(0);
    await expect(achievements.card('Primer pomodoro')).toContainText('0 de 1');
    await expect(achievements.card('Diez horas')).toContainText('0 min de 10 h');
    await expect(achievements.progress('Diez horas')).toHaveAttribute('max', '600');
  });

  test('RF-51: «Logros» está en la subnavegación y queda activo', async ({ signedInPage: page }) => {
    await page.goto('/pomodoro');
    const subNavigation = page.getByRole('navigation', { name: 'Secciones del pomodoro' });
    await subNavigation.getByRole('link', { name: 'Logros' }).click();
    await expect(page).toHaveURL('/pomodoro/achievements');
    await expect(subNavigation.getByRole('link', { name: 'Logros' })).toHaveAttribute('aria-current', 'page');
  });
});
