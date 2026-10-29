import type { Locator, Page } from '@playwright/test';

import type { Account } from '../fixtures/api-client';

// Page object del inicio de sesión: solo localizadores accesibles (AGENTS.md §2)
export class LoginPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly toRegister: Locator;
  readonly notice: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Iniciar sesión' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Contraseña', { exact: true });
    this.submit = page.getByRole('button', { name: 'Entrar' });
    this.toRegister = page.getByRole('link', { name: 'Crear una cuenta' });
    this.notice = page.getByRole('status');
    this.error = page.getByRole('alert');
  }

  async goto(path = '/login'): Promise<void> {
    await this.page.goto(path);
    await this.heading.waitFor();
  }

  async login(account: Account): Promise<void> {
    await this.email.fill(account.email);
    await this.password.fill(account.password);
    await this.submit.click();
  }
}
