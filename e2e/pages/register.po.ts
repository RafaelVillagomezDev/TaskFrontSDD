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
  // Estado del widget de Turnstile para lectores de pantalla (spec 005 RNF-01)
  readonly verified: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Crear cuenta' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Contraseña', { exact: true });
    this.name = page.getByLabel('Nombre (opcional)');
    this.submit = page.getByRole('button', { name: 'Crear cuenta' });
    this.showPassword = page.getByRole('button', { name: 'Mostrar contraseña' });
    this.verified = page.getByText('Comprobación completada.');
  }

  // Abre la pantalla sin esperar a Turnstile, para las pruebas del propio widget
  async open(): Promise<void> {
    // Sin esperar al evento load, que depende del script de Cloudflare (spec 005 RF-03)
    await this.page.goto('/register', { waitUntil: 'domcontentloaded' });
    await this.heading.waitFor();
  }

  // Abre la pantalla y espera a que Turnstile entregue el token (spec 005 RF-01)
  async goto(): Promise<void> {
    await this.open();
    await this.waitForVerification();
  }

  async waitForVerification(): Promise<void> {
    await this.verified.waitFor();
  }
}
