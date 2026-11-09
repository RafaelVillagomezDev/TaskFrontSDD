import type { Locator, Page } from '@playwright/test';

import { addDays, todayKey } from '@shared/date/day.util';
import { expect, test } from '../fixtures/pomodoro.fixture';
import type { PomodoroPage } from '../pages/pomodoro.po';

// Los errores de validación nunca llegan a la API (RF-07 a RF-11)
function trackSessionStarts(page: Page): string[] {
  const starts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/pomodoros') starts.push(request.url());
  });
  return starts;
}

async function expectFieldError(field: Locator, message: string): Promise<void> {
  await expect(field).toHaveAccessibleDescription(new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await expect(field).toHaveAttribute('aria-invalid', 'true');
}

function label(value: string): string {
  return value.length > 20 ? `${String(value.length)} caracteres` : value;
}

async function startedBody(pomodoro: PomodoroPage): Promise<unknown> {
  const page = pomodoro.startForm.page();
  const request = page.waitForRequest(
    (candidate) => candidate.method() === 'POST' && candidate.url().endsWith('/pomodoros'),
  );
  await pomodoro.submit.click();
  return (await request).postDataJSON();
}

test.describe('RF-07 y RF-55 (003): minutos de la duración «Otra»', () => {
  const cases: { value: string; message: string }[] = [
    { value: '', message: 'Escribe los minutos.' },
    { value: '   ', message: 'Escribe los minutos.' },
    { value: '25,5', message: 'Escribe un número entero de minutos.' },
    { value: 'abc', message: 'Escribe un número entero de minutos.' },
    { value: '0', message: 'Elige entre 1 y 120 minutos.' },
    { value: '121', message: 'Elige entre 1 y 120 minutos.' },
  ];

  for (const { value, message } of cases) {
    test(`RF-07: «${value}» → «${message}» sin llamar a la API`, async ({ pomodoro }) => {
      const starts = trackSessionStarts(pomodoro.startForm.page());
      await pomodoro.chooseDuration('Otra');
      await pomodoro.customMinutes.fill(value);
      await pomodoro.submit.click();

      await expectFieldError(pomodoro.customMinutes, message);
      await expect(pomodoro.startForm).toBeVisible();
      expect(starts).toEqual([]);
    });
  }

  test('RF-56: «Otra» con 50 minutos empieza una sesión de 50', async ({ pomodoro }) => {
    await pomodoro.chooseDuration('Otra');
    await pomodoro.customMinutes.fill('50');
    expect(await startedBody(pomodoro)).toMatchObject({ durationMinutes: 50 });
    await expect(pomodoro.session).toBeVisible();
  });
});

test.describe('RF-08 a RF-11 (003): campos de una tarea nueva', () => {
  const cases: { field: 'title' | 'description' | 'date'; value: string; message: string }[] = [
    { field: 'title', value: '', message: 'Escribe un título.' },
    { field: 'title', value: '    ', message: 'Escribe un título.' },
    { field: 'title', value: 't'.repeat(201), message: 'El título no puede tener más de 200 caracteres.' },
    { field: 'description', value: 'd'.repeat(1001), message: 'La descripción no puede tener más de 1000 caracteres.' },
    { field: 'date', value: '', message: 'Elige una fecha.' },
    { field: 'date', value: addDays(todayKey(), -1), message: 'Elige hoy o un día posterior.' },
  ];

  for (const { field, value, message } of cases) {
    test(`RF-08 a RF-11: ${field} «${label(value)}» → «${message}» sin llamar a la API`, async ({ pomodoro }) => {
      const starts = trackSessionStarts(pomodoro.startForm.page());
      await pomodoro.addNewTask({ title: 'Repasar' });
      await pomodoro.rowField(1, field).fill(value);
      await pomodoro.submit.click();

      await expectFieldError(pomodoro.rowField(1, field), message);
      expect(starts).toEqual([]);
    });
  }

  test('RF-08, RF-09 y RF-10: título de 200, descripción de 1000 y la fecha de hoy propuesta empiezan la sesión', async ({
    pomodoro,
  }) => {
    await pomodoro.addNewTask({ title: ` ${'t'.repeat(200)} `, description: 'd'.repeat(1000) });
    await expect(pomodoro.rowField(1, 'date')).toHaveValue(todayKey());
    await expect(pomodoro.rowField(1, 'date')).toHaveAttribute('min', todayKey());

    expect(await startedBody(pomodoro)).toMatchObject({
      newTasks: [{ title: 't'.repeat(200), description: 'd'.repeat(1000), date: todayKey() }],
    });
    await expect(pomodoro.sessionTasks.getByRole('listitem')).toHaveCount(1);
  });

  test('RF-10: una tarea para dentro de un mes también empieza la sesión', async ({ pomodoro }) => {
    const inAMonth = addDays(todayKey(), 30);
    await pomodoro.addNewTask({ title: 'Preparar el viaje', date: inAMonth });
    expect(await startedBody(pomodoro)).toMatchObject({ newTasks: [{ date: inAMonth }] });
  });
});

test.describe('Uso solo con teclado (003)', () => {
  test('elige la duración con flechas, añade una tarea y empieza la sesión sin ratón', async ({ pomodoro }) => {
    const page = pomodoro.startForm.page();
    await pomodoro.durationOption('25 min').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(pomodoro.durationOption('15 min')).toBeChecked();

    await pomodoro.addTask.focus();
    await page.keyboard.press('Enter');
    await expect(pomodoro.rowField(1, 'title')).toBeVisible();
    await pomodoro.rowField(1, 'title').focus();
    await page.keyboard.type('Repasar');

    await pomodoro.submit.focus();
    const request = page.waitForRequest(
      (candidate) => candidate.method() === 'POST' && candidate.url().endsWith('/pomodoros'),
    );
    await page.keyboard.press('Enter');

    expect((await request).postDataJSON()).toMatchObject({ durationMinutes: 15, newTasks: [{ title: 'Repasar' }] });
    await expect(pomodoro.session).toBeVisible();
  });
});

test.describe('RF-29 (003): campos del diálogo de añadir tareas', () => {
  const cases: { field: 'Título' | 'Fecha'; value: string; message: string }[] = [
    { field: 'Título', value: '', message: 'Escribe un título.' },
    { field: 'Título', value: 't'.repeat(201), message: 'El título no puede tener más de 200 caracteres.' },
    { field: 'Fecha', value: addDays(todayKey(), -1), message: 'Elige hoy o un día posterior.' },
  ];

  for (const { field, value, message } of cases) {
    test(`RF-29: ${field} «${label(value)}» → «${message}» sin llamar a la API`, async ({ pomodoro }) => {
      const page = pomodoro.startForm.page();
      await pomodoro.submit.click();
      const additions: string[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST' && request.url().endsWith('/tasks')) additions.push(request.url());
      });
      await pomodoro.openAddTasks.click();
      await pomodoro.addDialog.getByLabel('Título').fill('Llamar');
      await pomodoro.addDialog.getByLabel(field).fill(value);
      await pomodoro.addDialog.getByRole('button', { name: 'Añadir', exact: true }).click();

      await expectFieldError(pomodoro.addDialog.getByLabel(field), message);
      expect(additions).toEqual([]);
    });
  }
});

test.describe('RF-35 (003): campos del diálogo de editar una tarea', () => {
  const cases: { field: 'Título' | 'Descripción (opcional)'; value: string; message: string }[] = [
    { field: 'Título', value: '', message: 'Escribe un título.' },
    { field: 'Título', value: '   ', message: 'Escribe un título.' },
    { field: 'Título', value: 't'.repeat(201), message: 'El título no puede tener más de 200 caracteres.' },
    {
      field: 'Descripción (opcional)',
      value: 'd'.repeat(1001),
      message: 'La descripción no puede tener más de 1000 caracteres.',
    },
  ];

  for (const { field, value, message } of cases) {
    test(`RF-35: ${field} «${label(value)}» → «${message}» sin llamar a la API`, async ({ pomodoro }) => {
      const page = pomodoro.startForm.page();
      await pomodoro.addNewTask({ title: 'Repasar' });
      await pomodoro.submit.click();
      const edits: string[] = [];
      page.on('request', (request) => {
        if (request.method() === 'PATCH') edits.push(request.url());
      });
      await pomodoro.editButton('Repasar').click();
      await pomodoro.editDialog.getByLabel(field).fill(value);
      await pomodoro.editDialog.getByRole('button', { name: 'Guardar' }).click();

      await expectFieldError(pomodoro.editDialog.getByLabel(field), message);
      expect(edits).toEqual([]);
    });
  }

  test('RF-35: título de 200 y descripción de 1000 caracteres se guardan, solo con el teclado', async ({
    pomodoro,
  }) => {
    const page = pomodoro.startForm.page();
    await pomodoro.addNewTask({ title: 'Repasar' });
    await pomodoro.submit.click();
    await pomodoro.editButton('Repasar').focus();
    await page.keyboard.press('Enter');
    await pomodoro.editDialog.getByLabel('Título').fill('t'.repeat(200));
    await pomodoro.editDialog.getByLabel('Descripción (opcional)').fill('d'.repeat(1000));
    await pomodoro.editDialog.getByRole('button', { name: 'Guardar' }).focus();
    await page.keyboard.press('Enter');

    await expect(pomodoro.editDialog).toBeHidden();
    await expect(pomodoro.sessionTasks).toContainText('t'.repeat(200));
  });
});
