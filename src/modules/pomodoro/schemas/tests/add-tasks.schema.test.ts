import { createAddTasksSchema } from '../add-tasks.schema';

const TODAY = '2026-11-09';
const TASK = { title: 'Llamar a Marta', description: '', date: TODAY };
const BASE = { duration: '25', customMinutes: '', newTasks: [TASK], waitingTaskIds: [] };

function errorsOf(existing: number, values: Record<string, unknown>): Record<string, string> {
  const result = createAddTasksSchema(TODAY, existing).safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
}

describe('createAddTasksSchema', () => {
  it('RF-29: acepta una tarea nueva o una en espera', () => {
    expect(errorsOf(3, BASE)).toEqual({});
    expect(errorsOf(3, { ...BASE, newTasks: [], waitingTaskIds: ['w-1'] })).toEqual({});
  });

  it('RF-29: exige al menos una tarea', () => {
    expect(errorsOf(3, { ...BASE, newTasks: [] })).toEqual({ newTasks: 'Añade al menos una tarea.' });
  });

  it('RF-29: no deja pasar de 20 tareas contando las que ya tiene la sesión', () => {
    expect(errorsOf(19, BASE)).toEqual({});
    expect(errorsOf(19, { ...BASE, waitingTaskIds: ['w-1'] })).toEqual({
      newTasks: 'Una sesión puede tener como máximo 20 tareas.',
    });
  });

  it('RF-29: aplica las reglas de las tareas nuevas (RF-08 a RF-11)', () => {
    expect(errorsOf(0, { ...BASE, newTasks: [{ ...TASK, title: '' }] })).toEqual({
      'newTasks.0.title': 'Escribe un título.',
    });
    expect(errorsOf(0, { ...BASE, newTasks: [{ ...TASK, date: '2026-11-08' }] })).toEqual({
      'newTasks.0.date': 'Elige hoy o un día posterior.',
    });
  });

  it('no valida la duración, que este formulario no usa', () => {
    expect(errorsOf(0, { ...BASE, duration: 'custom', customMinutes: 'abc' })).toEqual({});
  });
});
