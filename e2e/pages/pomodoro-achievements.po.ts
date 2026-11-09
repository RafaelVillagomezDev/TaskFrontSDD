import type { Locator, Page } from '@playwright/test';

// Page object de /pomodoro/achievements (spec 003, HU-07): solo localizadores accesibles
export class PomodoroAchievementsPage {
  private readonly page: Page;
  readonly streak: Locator;
  readonly list: Locator;
  readonly cards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.streak = page.getByRole('region', { name: 'Racha del pomodoro' });
    this.list = page.getByRole('list', { name: 'Logros' });
    this.cards = this.list.getByRole('listitem');
  }

  // Valores de la racha en orden: racha actual y mejor racha (los <dd> de la lista de definiciones)
  streakValues(): Locator {
    return this.streak.getByRole('definition');
  }

  card(name: string): Locator {
    return this.cards.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  progress(name: string): Locator {
    return this.list.getByRole('progressbar', { name: `Progreso de «${name}»` });
  }

  async goto(): Promise<void> {
    await this.page.goto('/pomodoro/achievements');
    await this.list.waitFor();
  }
}
