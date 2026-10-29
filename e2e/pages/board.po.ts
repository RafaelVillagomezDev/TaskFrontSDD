import type { Locator, Page } from '@playwright/test';

import { formatDayLong } from '../../src/shared/date/date-format.util';

// Page object del tablero semanal: solo localizadores accesibles (AGENTS.md §2)
export class BoardPage {
  readonly heading: Locator;
  readonly board: Locator;
  readonly columns: Locator;
  readonly previousWeek: Locator;
  readonly nextWeek: Locator;
  readonly today: Locator;
  readonly newTask: Locator;
  readonly notice: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Tablero' });
    this.board = page.getByRole('region', { name: 'Tareas de la semana' });
    this.columns = this.board.getByRole('region');
    this.previousWeek = page.getByRole('button', { name: 'Semana anterior' });
    this.nextWeek = page.getByRole('button', { name: 'Semana siguiente' });
    this.today = page.getByRole('button', { name: 'Hoy', exact: true });
    this.newTask = page.getByRole('button', { name: 'Nueva tarea' });
    this.notice = page.getByRole('status');
  }

  // Nombre accesible de la columna de un día AAAA-MM-DD: «jueves, 29 de octubre de 2026»
  columnName(day: string): string {
    return formatDayLong(day);
  }

  column(day: string): Locator {
    return this.board.getByRole('region', { name: this.columnName(day), exact: true });
  }

  // «Añadir tarea» de la columna de un día
  addTaskTo(day: string): Locator {
    return this.board.getByRole('button', { name: `Añadir tarea el ${this.columnName(day)}` });
  }
}
