import { createStartSessionSchema, type SessionFormValues } from '../start-session.schema';

const TODAY = '2026-11-09';
const schema = createStartSessionSchema(TODAY);

const TASK = { title: 'Repasar el tema 3', description: '', date: TODAY };
const VALID: SessionFormValues = { duration: '25', customMinutes: '', newTasks: [], waitingTaskIds: [] };

function errorsOf(values: SessionFormValues): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
}

describe('createStartSessionSchema', () => {
  it.each(['15', '25', '45', '60'])('RF-06: acepta la duración fija de %s minutos', (duration) => {
    expect(errorsOf({ ...VALID, duration })).toEqual({});
  });

  it('RF-56: con una duración fija no valida el campo de «Otra»', () => {
    expect(errorsOf({ ...VALID, duration: '25', customMinutes: '999' })).toEqual({});
  });

  it.each(['1', '120', '50'])('RF-07: «Otra» acepta %s minutos', (customMinutes) => {
    expect(errorsOf({ ...VALID, duration: 'custom', customMinutes })).toEqual({});
  });

  it.each([
    ['', 'Escribe los minutos.'],
    ['   ', 'Escribe los minutos.'],
    ['25,5', 'Escribe un número entero de minutos.'],
    ['25.5', 'Escribe un número entero de minutos.'],
    ['abc', 'Escribe un número entero de minutos.'],
    ['0', 'Elige entre 1 y 120 minutos.'],
    ['121', 'Elige entre 1 y 120 minutos.'],
  ])('RF-07: «Otra» con «%s» → %s', (customMinutes, message) => {
    expect(errorsOf({ ...VALID, duration: 'custom', customMinutes })).toEqual({ customMinutes: message });
  });

  it('RF-06: rechaza una duración que no es de las ofrecidas', () => {
    expect(errorsOf({ ...VALID, duration: '30' })).toHaveProperty('duration');
  });

  it('RF-04: acepta una sesión sin tareas y otra con una tarea de hoy', () => {
    expect(errorsOf(VALID)).toEqual({});
    expect(errorsOf({ ...VALID, newTasks: [TASK] })).toEqual({});
  });

  it.each([
    ['título vacío', { title: '' }, 'newTasks.0.title', 'Escribe un título.'],
    ['título de solo espacios', { title: '   ' }, 'newTasks.0.title', 'Escribe un título.'],
    [
      'título de 201 caracteres',
      { title: 'a'.repeat(201) },
      'newTasks.0.title',
      'El título no puede tener más de 200 caracteres.',
    ],
    [
      'descripción de 1001 caracteres',
      { description: 'a'.repeat(1001) },
      'newTasks.0.description',
      'La descripción no puede tener más de 1000 caracteres.',
    ],
    ['fecha de ayer', { date: '2026-11-08' }, 'newTasks.0.date', 'Elige hoy o un día posterior.'],
  ])('RF-08 a RF-11: una tarea con %s', (_case, change, path, message) => {
    expect(errorsOf({ ...VALID, newTasks: [{ ...TASK, ...change }] })).toEqual({ [path]: message });
  });

  it('RF-08: acepta un título de 200 caracteres y una descripción de 1000', () => {
    const task = { ...TASK, title: 'a'.repeat(200), description: 'a'.repeat(1000) };
    expect(errorsOf({ ...VALID, newTasks: [task] })).toEqual({});
  });

  it('RF-13: acepta 20 tareas entre nuevas y en espera y rechaza 21', () => {
    const tasks = Array.from({ length: 15 }, () => TASK);
    const waiting = Array.from({ length: 5 }, (_, index) => `w-${String(index)}`);
    expect(errorsOf({ ...VALID, newTasks: tasks, waitingTaskIds: waiting })).toEqual({});
    expect(errorsOf({ ...VALID, newTasks: [...tasks, TASK], waitingTaskIds: waiting })).toEqual({
      newTasks: 'Una sesión puede tener como máximo 20 tareas.',
    });
  });
});
