import { streakSchema } from '../streak.schema';

describe('streakSchema (GET /streak de API-001)', () => {
  it('acepta la racha actual y la mejor, también a 0', () => {
    expect(streakSchema.parse({ current: 3, best: 5 })).toEqual({ current: 3, best: 5 });
    expect(streakSchema.parse({ current: 0, best: 0 })).toEqual({ current: 0, best: 0 });
  });

  it.each([
    ['sin la mejor racha', { current: 3 }],
    ['con un número negativo', { current: -1, best: 5 }],
    ['con decimales', { current: 1.5, best: 5 }],
    ['con un número como texto', { current: '3', best: 5 }],
  ])('rechaza una racha %s', (_case, value) => {
    expect(streakSchema.safeParse(value).success).toBe(false);
  });
});
