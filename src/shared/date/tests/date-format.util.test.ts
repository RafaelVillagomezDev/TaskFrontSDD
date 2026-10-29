import { formatDayLong, formatShortDate, formatWeekday } from '../date-format.util';

// Formato español de fechas (spec S-03)
describe('formato de fechas en español', () => {
  it('nombre del día de la semana', () => {
    expect(formatWeekday('2026-10-29')).toBe('jueves');
    expect(formatWeekday('2026-11-01')).toBe('domingo');
  });

  it('fecha corta con día, mes y año', () => {
    expect(formatShortDate('2026-01-05')).toBe('05/01/2026');
  });

  it('fecha larga', () => {
    expect(formatDayLong('2026-10-29')).toBe('jueves, 29 de octubre de 2026');
  });
});
