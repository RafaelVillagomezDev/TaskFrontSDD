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
  // Estado del widget de Turnstile para lectores de pantalla (spec 005 RNF-01)
  readonly verified: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Iniciar sesión' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Contraseña', { exact: true });
    this.submit = page.getByRole('button', { name: 'Entrar' });
    this.toRegister = page.getByRole('link', { name: 'Crear una cuenta' });
    this.notice = page.getByRole('status');
    this.error = page.getByRole('alert');
    this.verified = page.getByText('Comprobación completada.');
  }

  // Abre la pantalla sin esperar a Turnstile, para las pruebas del propio widget
  async open(path = '/login'): Promise<void> {
    // Sin esperar al evento load, que depende del script de Cloudflare (spec 005 RF-03)
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.heading.waitFor();
  }

  // Abre la pantalla y espera a que Turnstile entregue el token (spec 005 RF-01)
  async goto(path = '/login'): Promise<void> {
    await this.open(path);
    await this.waitForVerification();
  }

  async waitForVerification(): Promise<void> {
    await this.verified.waitFor();
  }

  async login(account: Account): Promise<void> {
    await this.email.fill(account.email);
    await this.password.fill(account.password);
    await this.waitForVerification();
    await this.submit.click();
  }
}
