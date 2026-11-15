import type { Locator, Page } from '@playwright/test';

// Page object de la cuenta: solo localizadores accesibles (AGENTS.md §2)
export class AccountPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly profile: Locator;
  readonly name: Locator;
  readonly saveName: Locator;
  readonly saved: Locator;
  readonly passwordSection: Locator;
  readonly currentPassword: Locator;
  readonly newPassword: Locator;
  readonly changePassword: Locator;
  readonly passwordChanged: Locator;
  readonly deleteSection: Locator;
  readonly openDelete: Locator;
  readonly deleteDialog: Locator;
  readonly deletePassword: Locator;
  readonly confirmDelete: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Cuenta' });
    this.profile = page.getByRole('region', { name: 'Perfil' });
    this.name = this.profile.getByLabel('Nombre (opcional)');
    this.saveName = this.profile.getByRole('button', { name: 'Guardar nombre' });
    this.saved = this.profile.getByRole('status').filter({ hasText: 'Nombre guardado.' });
    this.passwordSection = page.getByRole('region', { name: 'Cambiar contraseña' });
    this.currentPassword = this.passwordSection.getByLabel('Contraseña actual');
    this.newPassword = this.passwordSection.getByLabel('Contraseña nueva');
    this.changePassword = this.passwordSection.getByRole('button', { name: /^(Cambiar contraseña|Cambiando…)$/ });
    this.passwordChanged = this.passwordSection.getByRole('status').filter({ hasText: 'Contraseña cambiada.' });
    this.deleteSection = page.getByRole('region', { name: 'Borrar cuenta' });
    this.openDelete = this.deleteSection.getByRole('button', { name: 'Borrar mi cuenta' });
    this.deleteDialog = page.getByRole('dialog', { name: '¿Borrar tu cuenta?' });
    this.deletePassword = this.deleteDialog.getByLabel('Escribe tu contraseña para confirmar');
    this.confirmDelete = this.deleteDialog.getByRole('button', { name: /^(Borrar cuenta|Borrando…)$/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/account');
  }
}
