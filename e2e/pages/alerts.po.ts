import type { Locator, Page } from '@playwright/test';

// Page object de los avisos: solo localizadores accesibles (AGENTS.md §2)
export class AlertsPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly list: Locator;
  readonly empty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Avisos' });
    this.list = page.getByRole('list', { name: 'Lista de avisos' });
    this.empty = page.getByText('Todavía no tienes avisos.');
  }

  async goto(): Promise<void> {
    await this.page.goto('/alerts');
  }
}
