import type { Locator, Page } from '@playwright/test';

// Page object del registro: solo localizadores accesibles (AGENTS.md §2)
export class RegisterPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly name: Locator;
  readonly submit: Locator;
  readonly showPassword: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Crear cuenta' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Contraseña', { exact: true });
    this.name = page.getByLabel('Nombre (opcional)');
    this.submit = page.getByRole('button', { name: 'Crear cuenta' });
    this.showPassword = page.getByRole('button', { name: 'Mostrar contraseña' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
    await this.heading.waitFor();
  }
}
