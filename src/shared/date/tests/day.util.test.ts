import { addDays, compareDays, dayRange, isDayKey, parseDayKey, toDayKey } from '../day.util';

// Jest se ejecuta en America/Los_Angeles (package.json): a las 20:00 locales ya es el día siguiente en UTC
describe('toDayKey', () => {
  it('usa la fecha local del dispositivo, nunca la de UTC (plan D-4)', () => {
    const lateEvening = new Date(2026, 9, 29, 20, 0);
    expect(lateEvening.toISOString().slice(0, 10)).toBe('2026-10-30');
    expect(toDayKey(lateEvening)).toBe('2026-10-29');
  });

  it('rellena mes y día con ceros', () => {
    expect(toDayKey(new Date(2026, 0, 5, 9, 0))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('suma y resta días', () => {
    expect(addDays('2026-10-29', 6)).toBe('2026-11-04');
    expect(addDays('2026-10-29', -7)).toBe('2026-10-22');
  });

  it('cruza meses y años', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('incluye el 29 de febrero de los años bisiestos', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('no se descuadra en el cambio de horario de verano', () => {
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
  });
});

describe('compareDays', () => {
  it('ordena días', () => {
    expect(compareDays('2026-10-29', '2026-10-30')).toBeLessThan(0);
    expect(compareDays('2026-10-30', '2026-10-29')).toBeGreaterThan(0);
    expect(compareDays('2026-10-29', '2026-10-29')).toBe(0);
  });
});

describe('dayRange', () => {
  it('devuelve los días seguidos desde el inicio', () => {
    expect(dayRange('2026-10-29', 3)).toEqual(['2026-10-29', '2026-10-30', '2026-10-31']);
  });
});

describe('isDayKey', () => {
  it('acepta días de calendario válidos con formato AAAA-MM-DD', () => {
    expect(isDayKey('2026-10-29')).toBe(true);
    expect(isDayKey('2028-02-29')).toBe(true);
  });

  it('rechaza formatos incorrectos y días inexistentes', () => {
    expect(isDayKey('2026-2-3')).toBe(false);
    expect(isDayKey('2026-02-30')).toBe(false);
    expect(isDayKey('2027-02-29')).toBe(false);
    expect(isDayKey('hoy')).toBe(false);
  });
});

describe('parseDayKey', () => {
  it('devuelve la medianoche local de ese día', () => {
    const date = parseDayKey('2026-10-29');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 9, 29, 0]);
  });
});
