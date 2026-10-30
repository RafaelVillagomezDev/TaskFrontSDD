import type { Locator, Page } from '@playwright/test';

// Page object de la cuenta: solo localizadores accesibles (AGENTS.md §2)
export class AccountPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly profile: Locator;
  readonly name: Locator;
  readonly saveName: Locator;
  readonly saved: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Cuenta' });
    this.profile = page.getByRole('region', { name: 'Perfil' });
    this.name = this.profile.getByLabel('Nombre (opcional)');
    this.saveName = this.profile.getByRole('button', { name: 'Guardar nombre' });
    this.saved = this.profile.getByRole('status').filter({ hasText: 'Nombre guardado.' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/account');
  }
}
