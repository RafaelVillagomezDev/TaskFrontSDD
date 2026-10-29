import { buildClientTimeHeaders, formatClientTime, formatUtcOffset } from '../client-time.util';

// Jest se ejecuta en America/Los_Angeles (package.json): -07:00 en verano y -08:00 en invierno
describe('formatUtcOffset (API-001 RF-31: desfase ±HH:MM, nunca Z)', () => {
  it('UTC se escribe +00:00', () => {
    expect(formatUtcOffset(0)).toBe('+00:00');
  });

  it('zonas al este de UTC, con minutos', () => {
    expect(formatUtcOffset(-120)).toBe('+02:00');
    expect(formatUtcOffset(-330)).toBe('+05:30');
    expect(formatUtcOffset(-765)).toBe('+12:45');
  });

  it('zonas al oeste de UTC', () => {
    expect(formatUtcOffset(420)).toBe('-07:00');
    expect(formatUtcOffset(210)).toBe('-03:30');
  });
});

describe('formatClientTime', () => {
  it('hora local con el desfase de verano', () => {
    expect(formatClientTime(new Date(2026, 6, 15, 9, 5, 7))).toBe('2026-07-15T09:05:07-07:00');
  });

  it('hora local con el desfase de invierno (cambio de horario de verano)', () => {
    expect(formatClientTime(new Date(2026, 0, 15, 23, 30, 0))).toBe('2026-01-15T23:30:00-08:00');
  });

  it('nunca termina en Z', () => {
    expect(formatClientTime(new Date())).not.toMatch(/Z$/);
  });
});

describe('buildClientTimeHeaders', () => {
  it('envía la hora local y la zona IANA del dispositivo (API-001 RF-31 a RF-33)', () => {
    expect(buildClientTimeHeaders(new Date(2026, 9, 29, 20, 0, 0))).toEqual({
      'X-Client-Time': '2026-10-29T20:00:00-07:00',
      'X-Timezone': 'America/Los_Angeles',
    });
  });

  it('acepta una zona explícita', () => {
    expect(buildClientTimeHeaders(new Date(2026, 9, 29, 20, 0, 0), 'Europe/Madrid')['X-Timezone']).toBe(
      'Europe/Madrid',
    );
  });
});
