import { alertSchema } from '../alert.schema';

const ALERT = {
  id: 'al1',
  type: 'weekly',
  periodStart: '2026-10-23',
  periodEnd: '2026-10-25',
  tasks: [{ id: 't1', title: 'Llamar al banco', date: '2026-10-24' }],
  createdAt: '2026-10-23T22:00:00Z',
};

describe('alertSchema (recurso Alert de API-001)', () => {
  it.each(['daily', 'weekly', 'monthly'])('acepta un aviso de tipo %s', (type) => {
    expect(alertSchema.parse({ ...ALERT, type }).type).toBe(type);
  });

  it('acepta createdAt con desfase horario y un aviso sin tareas', () => {
    expect(alertSchema.safeParse({ ...ALERT, createdAt: '2026-10-23T22:00:00+02:00', tasks: [] }).success).toBe(true);
  });

  it.each([
    ['con un tipo desconocido', { type: 'yearly' }],
    ['con un periodo que no es un día válido', { periodStart: '2026-02-30' }],
    ['con createdAt que no es una fecha ISO', { createdAt: '23/10/2026 22:00' }],
    ['con una tarea sin título', { tasks: [{ id: 't1', date: '2026-10-24' }] }],
  ])('rechaza un aviso %s', (_case, change) => {
    expect(alertSchema.safeParse({ ...ALERT, ...change }).success).toBe(false);
  });
});
