import type { Locator, Page } from '@playwright/test';

// Page object de /pomodoro/history y del detalle de una sesión (spec 003, HU-06): solo localizadores accesibles
export class PomodoroHistoryPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly list: Locator;
  readonly items: Locator;
  readonly empty: Locator;
  readonly detailTasks: Locator;
  readonly backToHistory: Locator;
  readonly notFound: Locator;
  readonly goToPomodoro: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 2, name: 'Historial de sesiones' });
    this.list = page.getByRole('list', { name: 'Sesiones' });
    this.items = this.list.getByRole('listitem');
    this.empty = page.getByText('Todavía no tienes sesiones.');
    this.detailTasks = page.getByRole('list', { name: 'Tareas de la sesión' });
    this.backToHistory = page.getByRole('link', { name: 'Volver al historial' });
    this.notFound = page.getByText('No encontramos esta sesión.');
    this.goToPomodoro = page.getByRole('link', { name: 'Ir al pomodoro' });
  }

  // Enlace al detalle de la sesión n-ésima de la lista (de la más reciente a la más antigua)
  openSession(position: number): Locator {
    return this.items.nth(position).getByRole('link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/pomodoro/history');
    await this.heading.waitFor();
  }

  async gotoSession(id: string): Promise<void> {
    await this.page.goto(`/pomodoro/history/${id}`);
  }
}
