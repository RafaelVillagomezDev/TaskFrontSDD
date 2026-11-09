import { expect, test } from '../fixtures/pomodoro.fixture';
import { expectResponsive } from '../fixtures/responsive.fixture';

test.describe('HU-01 (003): empezar una sesión con una lista de tareas', () => {
  test('RF-04, RF-06 y RF-14: sin sesión activa se ve el formulario con 25 min; empezar sin tareas muestra la sesión', async ({
    pomodoro,
  }, testInfo) => {
    await expect(pomodoro.startForm).toBeVisible();
    await expect(pomodoro.durationOption('25 min')).toBeChecked();
    await expectResponsive(pomodoro.startForm.page(), testInfo);

    await pomodoro.submit.click();

    await expect(pomodoro.session).toBeVisible();
    await expect(pomodoro.session.getByRole('heading', { name: 'Sesión en curso' })).toBeVisible();
    await expect(pomodoro.session.getByText('Esta sesión no tiene tareas.')).toBeVisible();
    await expect(pomodoro.startForm).toBeHidden();
  });

  test('RF-05, RF-14 y RF-20: empezar con dos tareas las muestra en el orden escrito, y siguen al recargar', async ({
    pomodoro,
  }) => {
    await pomodoro.addNewTask({ title: 'Repasar el tema 3' });
    await pomodoro.addNewTask({ title: 'Llamar a Marta', description: 'Antes de comer' });

    await pomodoro.submit.click();

    await expect(pomodoro.sessionTasks.getByRole('listitem')).toHaveText([/^Repasar el tema 3/, /^Llamar a Marta/]);
    await expect(pomodoro.session.getByText('0 de 2 tareas hechas')).toBeVisible();

    await pomodoro.goto();
    await expect(pomodoro.sessionTasks.getByRole('listitem')).toHaveCount(2);
  });
});

test.describe('HU-02 (003): seguir la sesión en curso', () => {
  test('RF-15 y CE-02: la cuenta atrás corre y, al recargar, sigue en el mismo punto (±2 s)', async ({ pomodoro }) => {
    await pomodoro.submit.click();
    await expect(pomodoro.clock).toBeVisible();
    await expect.poll(async () => pomodoro.secondsLeft()).toBeLessThan(1500);
    await expect(pomodoro.startForm.page()).toHaveTitle(/^\d{2}:\d{2} · Pomodoro$/);

    const before = await pomodoro.secondsLeft();
    await pomodoro.goto();
    const after = await pomodoro.secondsLeft();
    expect(Math.abs(before - after)).toBeLessThanOrEqual(2);
  });

  test('RF-11, RF-21 y RF-22: completar y desmarcar una tarea cambia el resumen sin recargar', async ({ pomodoro }) => {
    await pomodoro.addNewTask({ title: 'Repasar el tema 3' });
    await pomodoro.addNewTask({ title: 'Llamar a Marta' });
    await pomodoro.submit.click();
    await expect(pomodoro.session.getByText('0 de 2 tareas hechas')).toBeVisible();

    // Sin cambio optimista (plan D-2): la casilla cambia cuando responde la API, así que se pulsa y se espera
    await pomodoro.taskCheckbox('Llamar a Marta').click();
    await expect(pomodoro.session.getByText('1 de 2 tareas hechas')).toBeVisible();
    await expect(pomodoro.taskCheckbox('Llamar a Marta')).toBeChecked();

    await pomodoro.taskCheckbox('Llamar a Marta').click();
    await expect(pomodoro.session.getByText('0 de 2 tareas hechas')).toBeVisible();
  });

  test('RF-22: una tarea se completa solo con el teclado', async ({ pomodoro }) => {
    await pomodoro.addNewTask({ title: 'Repasar' });
    await pomodoro.submit.click();
    await pomodoro.taskCheckbox('Repasar').focus();
    await pomodoro.startForm.page().keyboard.press('Space');
    await expect(pomodoro.session.getByText('1 de 1 tareas hechas')).toBeVisible();
  });
});

test.describe('HU-03 (003): pausar, reanudar y terminar la sesión', () => {
  test('RF-16, RF-23, RF-24, RF-58 y RF-63: pausar detiene la cuenta atrás (también tras recargar) y reanudar sigue', async ({
    pomodoro,
  }) => {
    const page = pomodoro.startForm.page();
    await pomodoro.submit.click();
    await pomodoro.pause.click();

    await expect(pomodoro.session.getByRole('heading', { name: 'Sesión en pausa' })).toBeVisible();
    await expect(page).toHaveTitle(/^En pausa \d{2}:\d{2} · Pomodoro$/);
    await expect(pomodoro.announcement('Sesión en pausa.')).toHaveCount(1);
    const paused = await pomodoro.secondsLeft();
    await pomodoro.goto();
    expect(await pomodoro.secondsLeft()).toBe(paused);

    await pomodoro.resume.click();
    await expect(pomodoro.session.getByRole('heading', { name: 'Sesión en curso' })).toBeVisible();
    await expect(pomodoro.announcement('Sesión reanudada.')).toHaveCount(1);
    await expect.poll(async () => pomodoro.secondsLeft()).toBeLessThan(paused);
  });

  test('RF-25 a RF-28 y RF-72: terminar pide confirmación y muestra el resultado, que sigue al recargar', async ({
    pomodoro,
  }) => {
    await pomodoro.addNewTask({ title: 'Hecha' });
    await pomodoro.addNewTask({ title: 'Sin hacer' });
    await pomodoro.submit.click();
    await pomodoro.taskCheckbox('Hecha').click();
    await expect(pomodoro.session.getByText('1 de 2 tareas hechas')).toBeVisible();

    await pomodoro.finish.click();
    await expect(pomodoro.confirmDialog).toBeVisible();
    await pomodoro.confirmDialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(pomodoro.session).toBeVisible();

    await pomodoro.finish.click();
    await pomodoro.confirmDialog.getByRole('button', { name: 'Terminar sesión' }).click();

    await expect(pomodoro.result).toContainText('Terminada a mano');
    await expect(pomodoro.result).toContainText('1 de 2 tareas hechas');
    await expect(pomodoro.result.getByRole('list', { name: 'Pendientes' })).toContainText('Sin hacer');
    await expect(pomodoro.result).toContainText('Han pasado a tus tareas en espera');

    await pomodoro.startForm.page().reload();
    await expect(pomodoro.result).toBeVisible();
    await pomodoro.startAnother.click();
    await expect(pomodoro.startForm).toBeVisible();
  });

  test('RF-26: el diálogo de terminar se usa con el teclado y Escape no termina', async ({ pomodoro }) => {
    const page = pomodoro.startForm.page();
    await pomodoro.submit.click();
    await pomodoro.finish.focus();
    await page.keyboard.press('Enter');
    await expect(pomodoro.confirmDialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pomodoro.confirmDialog).toBeHidden();
    await expect(pomodoro.session).toBeVisible();
  });
});
