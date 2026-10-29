import type { Locator, Page } from '@playwright/test';

// Shell de las pantallas privadas: en móvil y tablet la navegación está en el menú (Drawer)
export class AppShell {
  private readonly page: Page;
  readonly openMenu: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openMenu = page.getByRole('button', { name: 'Abrir menú' });
    this.logoutButton = page.getByRole('button', { name: 'Cerrar sesión' });
  }

  pageHeading(name: string): Locator {
    return this.page.getByRole('heading', { level: 1, name });
  }

  // Abre el menú si la navegación está en el Drawer (móvil y tablet) y sigue el enlace
  async navigateTo(screen: string): Promise<void> {
    if (await this.openMenu.isVisible()) await this.openMenu.click();
    await this.page.getByRole('link', { name: screen }).click();
  }

  async logout(): Promise<void> {
    if (await this.openMenu.isVisible()) await this.openMenu.click();
    await this.logoutButton.click();
  }
}
