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

  // Nombre visible de la cuenta en la navegación (RF-50, RF-53): en el Sidebar (complementary) o, en móvil y
  // tablet, dentro del menú (dialog)
  async displayName(text: string): Promise<Locator> {
    const inMenu = await this.openMenu.isVisible();
    if (inMenu) await this.openMenu.click();
    return this.page.getByRole(inMenu ? 'dialog' : 'complementary').getByText(text, { exact: true });
  }

  async logout(): Promise<void> {
    if (await this.openMenu.isVisible()) await this.openMenu.click();
    await this.logoutButton.click();
  }
}
