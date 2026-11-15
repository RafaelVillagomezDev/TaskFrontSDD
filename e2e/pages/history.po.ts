import type { Locator, Page } from '@playwright/test';

// Page object del historial: solo localizadores accesibles (AGENTS.md §2)
export class HistoryPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly filters: Locator;
  readonly status: Locator;
  readonly from: Locator;
  readonly to: Locator;
  readonly apply: Locator;
  readonly clear: Locator;
  readonly list: Locator;
  readonly items: Locator;
  readonly pagination: Locator;
  readonly nextPage: Locator;
  readonly previousPage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Historial' });
    this.filters = page.getByRole('form', { name: 'Filtros del historial' });
    this.status = this.filters.getByLabel('Estado');
    this.from = this.filters.getByLabel('Desde');
    this.to = this.filters.getByLabel('Hasta');
    this.apply = this.filters.getByRole('button', { name: 'Filtrar' });
    this.clear = this.filters.getByRole('button', { name: 'Quitar filtros' });
    this.list = page.getByRole('list', { name: 'Tareas del historial' });
    this.items = this.list.getByRole('listitem');
    this.pagination = page.getByRole('navigation', { name: 'Paginación' });
    this.nextPage = this.pagination.getByRole('button', { name: 'Página siguiente' });
    this.previousPage = this.pagination.getByRole('button', { name: 'Página anterior' });
  }

  async goto(search = ''): Promise<void> {
    await this.page.goto(`/history${search}`);
  }
}
