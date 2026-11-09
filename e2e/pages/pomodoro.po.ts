import type { Locator, Page } from '@playwright/test';

export interface NewTaskInput {
  title: string;
  description?: string;
  date?: string;
}

// Page object de /pomodoro (spec 003): solo localizadores accesibles (AGENTS.md §2)
export class PomodoroPage {
  private readonly page: Page;
  readonly heading: Locator;
  readonly startForm: Locator;
  readonly customMinutes: Locator;
  readonly addTask: Locator;
  readonly taskLimit: Locator;
  readonly submit: Locator;
  readonly session: Locator;
  readonly sessionTasks: Locator;
  readonly clock: Locator;
  readonly pause: Locator;
  readonly resume: Locator;
  readonly finish: Locator;
  readonly mute: Locator;
  readonly confirmDialog: Locator;
  readonly result: Locator;
  readonly startAnother: Locator;
  readonly openAddTasks: Locator;
  readonly addDialog: Locator;
  readonly waitingList: Locator;
  readonly waitingPicker: Locator;
  readonly editDialog: Locator;
  readonly deleteDialog: Locator;
  readonly newAchievements: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Pomodoro' });
    this.startForm = page.getByRole('form', { name: 'Empezar una sesión' });
    this.customMinutes = page.getByLabel('Minutos');
    this.addTask = page.getByRole('button', { name: 'Añadir tarea' });
    this.taskLimit = page.getByText('Has llegado al máximo de 20 tareas por sesión.');
    this.submit = page.getByRole('button', { name: 'Empezar sesión' });
    this.session = page.getByRole('region', { name: 'Sesión en marcha' });
    this.sessionTasks = this.session.getByRole('list', { name: 'Tareas de la sesión' });
    this.clock = this.session.getByText(/^Tiempo restante: \d+:\d{2}$/);
    this.pause = page.getByRole('button', { name: 'Pausar' });
    this.resume = page.getByRole('button', { name: 'Reanudar' });
    this.finish = page.getByRole('button', { name: 'Terminar', exact: true });
    this.mute = page.getByRole('button', { name: 'Silenciar el aviso de fin' });
    this.confirmDialog = page.getByRole('dialog', { name: '¿Terminar la sesión?' });
    this.result = page.getByRole('region', { name: 'Resultado de la sesión' });
    this.startAnother = page.getByRole('button', { name: 'Empezar otra sesión' });
    this.openAddTasks = page.getByRole('button', { name: 'Añadir tareas' });
    this.addDialog = page.getByRole('dialog', { name: 'Añadir tareas a la sesión' });
    this.waitingList = page.getByRole('list', { name: 'Tareas en espera' });
    this.waitingPicker = page.getByRole('group', { name: 'Incluir tareas en espera' });
    this.editDialog = page.getByRole('dialog', { name: 'Editar tarea' });
    this.deleteDialog = page.getByRole('dialog', { name: '¿Borrar la tarea?' });
    this.newAchievements = this.result.getByRole('status').filter({ hasText: /^¡Logros? conseguidos?!/ });
  }

  // Quitar de la sesión, editar y borrar, por el título de la tarea
  removeFromSession(title: string): Locator {
    return this.session.getByRole('button', { name: `Quitar «${title}» de la sesión` });
  }

  editButton(title: string): Locator {
    return this.page.getByRole('button', { name: `Editar «${title}»` });
  }

  deleteButton(title: string): Locator {
    return this.waitingList.getByRole('button', { name: `Borrar «${title}»` });
  }

  // Segundos que marca la cuenta atrás
  async secondsLeft(): Promise<number> {
    const text = (await this.clock.textContent()) ?? '';
    const [minutes = '0', seconds = '0'] = text.replace('Tiempo restante: ', '').split(':');
    return Number(minutes) * 60 + Number(seconds);
  }

  // Casilla de completar de una tarea de la sesión
  taskCheckbox(title: string): Locator {
    return this.session.getByRole('checkbox', { name: `Completar «${title}»` });
  }

  // Anuncio para lectores de pantalla (región viva <output>)
  announcement(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  async goto(): Promise<void> {
    await this.page.goto('/pomodoro');
    await this.heading.waitFor();
  }

  // Opción de duración: el radio está oculto (sr-only) y se elige pulsando su texto, como hace el usuario
  durationOption(label: string): Locator {
    return this.page.getByRole('radio', { name: label });
  }

  async chooseDuration(label: string): Promise<void> {
    await this.startForm.getByText(label, { exact: true }).click();
  }

  row(position: number): Locator {
    return this.page.getByRole('group', { name: `Tarea ${String(position)}` });
  }

  rowField(position: number, field: 'title' | 'description' | 'date'): Locator {
    const labels = { title: 'Título', description: 'Descripción (opcional)', date: 'Fecha' };
    return this.row(position).getByLabel(labels[field]);
  }

  // Añade una fila y la rellena; la fecha solo se cambia si se indica (propone la de hoy)
  async addNewTask(task: NewTaskInput): Promise<void> {
    await this.addTask.click();
    const position = await this.page.getByRole('group', { name: /^Tarea \d+$/ }).count();
    await this.rowField(position, 'title').fill(task.title);
    if (task.description !== undefined) await this.rowField(position, 'description').fill(task.description);
    if (task.date !== undefined) await this.rowField(position, 'date').fill(task.date);
  }
}
