import { createEditPomodoroTaskSchema } from '../edit-pomodoro-task.schema';

const schema = createEditPomodoroTaskSchema('2026-11-09');

describe('createEditPomodoroTaskSchema', () => {
  it('RF-35: acepta título y descripción válidos y no tiene fecha', () => {
    const parsed = schema.parse({ title: 'Repasar', description: '', date: '2020-01-01' });
    expect(parsed).toEqual({ title: 'Repasar', description: '' });
  });

  it.each([
    [{ title: '', description: '' }, 'Escribe un título.'],
    [{ title: 'a'.repeat(201), description: '' }, 'El título no puede tener más de 200 caracteres.'],
    [{ title: 'Repasar', description: 'a'.repeat(1001) }, 'La descripción no puede tener más de 1000 caracteres.'],
  ])('RF-35: rechaza %o con «%s»', (values, message) => {
    const result = schema.safeParse(values);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});
