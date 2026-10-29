import { taskSchema } from '../task.schema';

const TASK = {
  id: 'b3f1c2e4-0000-4000-8000-000000000001',
  title: 'Comprar pan',
  description: null,
  date: '2026-10-29',
  completed: false,
  createdAt: '2026-10-29T09:15:00Z',
  updatedAt: '2026-10-29T09:15:00Z',
};

describe('taskSchema (recurso Task de API-001)', () => {
  it('acepta una tarea con descripción nula o con texto', () => {
    expect(taskSchema.parse(TASK)).toEqual(TASK);
    expect(taskSchema.parse({ ...TASK, description: 'Integral' }).description).toBe('Integral');
  });

  it.each([
    ['sin título', { title: undefined }],
    ['con completed como texto', { completed: 'false' }],
    ['sin fecha', { date: undefined }],
    ['con una fecha que no es AAAA-MM-DD', { date: '29/10/2026' }],
    ['con un día inexistente', { date: '2026-02-30' }],
  ])('rechaza una tarea %s', (_case, change) => {
    expect(taskSchema.safeParse({ ...TASK, ...change }).success).toBe(false);
  });
});
