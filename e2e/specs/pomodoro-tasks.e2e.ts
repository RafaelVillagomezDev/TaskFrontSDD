import { addDays, todayKey } from '@shared/date/day.util';
import { createWaitingTasksInPage, startPomodoroInPage } from '../fixtures/api-client';
import { expect, test } from '../fixtures/pomodoro.fixture';
import type { PomodoroPage } from '../pages/pomodoro.po';

async function startWith(pomodoro: PomodoroPage, titles: string[]): Promise<void> {
  const page = pomodoro.startForm.page();
  await startPomodoroInPage(page, { newTasks: titles.map((title) => ({ title, date: todayKey() })) });
  await pomodoro.goto();
  await expect(pomodoro.session).toBeVisible();
}

test.describe('HU-04 (003): cambiar la lista de la sesión activa', () => {
  test('RF-29 y RF-30: añadir una tarea la pone al final; quitar una pendiente la pasa a espera', async ({
    pomodoro,
  }) => {
    await startWith(pomodoro, ['Primera', 'Segunda']);

    await pomodoro.openAddTasks.click();
    await pomodoro.addDialog.getByLabel('Título').fill('Llamar a Marta');
    await pomodoro.addDialog.getByRole('button', { name: 'Añadir', exact: true }).click();

    await expect(pomodoro.addDialog).toBeHidden();
    await expect(pomodoro.sessionTasks.getByRole('listitem')).toHaveText([/^Primera/, /^Segunda/, /^Llamar a Marta/]);

    await pomodoro.removeFromSession('Primera').click();
    await expect(pomodoro.sessionTasks.getByRole('listitem')).toHaveCount(2);
    await expect(pomodoro.waitingList).toContainText('Primera');
  });

  test('RF-31: una tarea completada no ofrece quitarla hasta desmarcarla', async ({ pomodoro }) => {
    await startWith(pomodoro, ['Hecha']);
    await pomodoro.taskCheckbox('Hecha').click();
    await expect(pomodoro.taskCheckbox('Hecha')).toBeChecked();
    await expect(pomodoro.removeFromSession('Hecha')).toHaveCount(0);

    await pomodoro.taskCheckbox('Hecha').click();
    await expect(pomodoro.removeFromSession('Hecha')).toBeVisible();
  });
});

test.describe('HU-05 (003): recuperar las tareas que quedaron sin hacer', () => {
  test('RF-12, RF-28 y RF-32: terminar con una pendiente la deja en espera y se puede incluir en otra sesión', async ({
    pomodoro,
  }) => {
    await startWith(pomodoro, ['Sin hacer']);
    await pomodoro.finish.click();
    await pomodoro.confirmDialog.getByRole('button', { name: 'Terminar sesión' }).click();
    await expect(pomodoro.waitingList).toContainText('Sin hacer');

    await pomodoro.startAnother.click();
    await pomodoro.waitingPicker.getByRole('checkbox', { name: /Sin hacer/ }).click();
    await pomodoro.submit.click();

    await expect(pomodoro.sessionTasks.getByRole('listitem')).toHaveText([/^Sin hacer/]);
    await expect(pomodoro.waitingList).toHaveCount(0);
  });

  test('RF-37: una tarea en espera de otro día se distingue de las de fecha pasada', async ({ pomodoro }) => {
    await createWaitingTasksInPage(pomodoro.startForm.page(), [{ title: 'Para mañana', date: addDays(todayKey(), 1) }]);
    await pomodoro.goto();
    await expect(pomodoro.waitingList).toContainText('Para mañana');
    await expect(pomodoro.waitingList).toContainText(/Para el /);
  });

  test('RF-35 y RF-36: corregir el título de una tarea en espera, sin poder cambiar su fecha', async ({ pomodoro }) => {
    await createWaitingTasksInPage(pomodoro.startForm.page(), [{ title: 'Repasar el tem 3', date: todayKey() }]);
    await pomodoro.goto();

    await pomodoro.editButton('Repasar el tem 3').click();
    await expect(pomodoro.editDialog.getByLabel('Fecha')).toHaveCount(0);
    await pomodoro.editDialog.getByLabel('Título').fill('Repasar el tema 3');
    await pomodoro.editDialog.getByRole('button', { name: 'Guardar' }).click();

    await expect(pomodoro.editDialog).toBeHidden();
    await expect(pomodoro.waitingList).toContainText('Repasar el tema 3');
  });

  test('RF-35: editar una tarea de la sesión activa', async ({ pomodoro }) => {
    await startWith(pomodoro, ['Llamar a Mrta']);
    await pomodoro.editButton('Llamar a Mrta').click();
    await pomodoro.editDialog.getByLabel('Título').fill('Llamar a Marta');
    await pomodoro.editDialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(pomodoro.sessionTasks).toContainText('Llamar a Marta');
  });

  test('RF-33: borrar una tarea en espera pide confirmación; cancelar no borra', async ({ pomodoro }) => {
    await createWaitingTasksInPage(pomodoro.startForm.page(), [{ title: 'Ya no la quiero', date: todayKey() }]);
    await pomodoro.goto();

    await pomodoro.deleteButton('Ya no la quiero').click();
    await expect(pomodoro.deleteDialog).toContainText('No se puede deshacer');
    await pomodoro.deleteDialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(pomodoro.waitingList).toContainText('Ya no la quiero');

    await pomodoro.deleteButton('Ya no la quiero').click();
    await pomodoro.deleteDialog.getByRole('button', { name: 'Borrar tarea' }).click();
    await expect(pomodoro.waitingList).toHaveCount(0);
  });
});
