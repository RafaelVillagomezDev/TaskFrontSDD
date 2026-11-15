import type { Locator, Page } from '@playwright/test';

// Page object del diálogo de crear o editar tarea («Nueva tarea» o «Editar tarea»): solo localizadores accesibles
// (AGENTS.md §2)
export class TaskFormDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly date: Locator;
  readonly submit: Locator;
  readonly cancel: Locator;
  readonly error: Locator;

  constructor(page: Page, name: 'Nueva tarea' | 'Editar tarea' = 'Nueva tarea') {
    this.dialog = page.getByRole('dialog', { name });
    this.title = this.dialog.getByLabel('Título');
    this.description = this.dialog.getByLabel('Descripción (opcional)');
    this.date = this.dialog.getByLabel('Fecha');
    this.submit = this.dialog.getByRole('button', { name: /^(Crear tarea|Creando…|Guardar cambios|Guardando…)$/ });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancelar' });
    this.error = this.dialog.getByRole('alert');
  }

  async fill(values: { title: string; description?: string; date?: string }): Promise<void> {
    await this.title.fill(values.title);
    await this.description.fill(values.description ?? '');
    if (values.date !== undefined) await this.date.fill(values.date);
  }
}
