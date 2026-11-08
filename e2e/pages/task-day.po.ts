import type { Locator, Page } from '@playwright/test';

// Page object de «Hecho hoy» (spec 002): solo localizadores accesibles (AGENTS.md §2)
export class TaskDayPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly list: Locator;
  readonly items: Locator;
  readonly pagination: Locator;
  readonly empty: Locator;
  readonly goToBoard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Hecho hoy' });
    this.list = page.getByRole('list', { name: 'Tareas hechas hoy' });
    this.items = this.list.getByRole('listitem');
    this.pagination = page.getByRole('navigation', { name: 'Paginación' });
    this.empty = page.getByText('Todavía no has completado ninguna tarea hoy.');
    this.goToBoard = page.getByRole('link', { name: 'Ir al tablero' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/taskday');
  }
}
