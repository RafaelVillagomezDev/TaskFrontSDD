import { formatDateTime, formatDayLong, formatShortDate, formatTime, formatWeekday } from '../date-format.util';

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

  it('hora local con dos cifras', () => {
    expect(formatTime(new Date(2026, 9, 24, 22, 0))).toBe('22:00');
    expect(formatTime(new Date(2026, 9, 24, 7, 5))).toBe('07:05');
  });

  it('003 RF-39: fecha y hora local de un instante de la API', () => {
    // Los tests corren en America/Los_Angeles (UTC-8 en noviembre)
    expect(formatDateTime('2026-11-09T18:30:00Z')).toBe('9 nov 2026, 10:30');
  });
});
