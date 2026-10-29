import { toDayKey } from '../date/day.util';

// Cabeceras de hora que exige TaskApiSDD en /tasks, /streak y /alerts (API-001 RF-31 a RF-33, plan D-3)
export interface ClientTimeHeaders {
  'X-Client-Time': string;
  'X-Timezone': string;
}

const MINUTES_PER_HOUR = 60;
const PAD_LENGTH = 2;

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, '0');
}

// getTimezoneOffset() devuelve minutos positivos al oeste de UTC; la API exige ±HH:MM y rechaza Z
export function formatUtcOffset(timezoneOffsetMinutes: number): string {
  const sign = timezoneOffsetMinutes > 0 ? '-' : '+';
  const absolute = Math.abs(timezoneOffsetMinutes);
  return `${sign}${pad(Math.floor(absolute / MINUTES_PER_HOUR))}:${pad(absolute % MINUTES_PER_HOUR)}`;
}

// ISO 8601 con la hora local y su desfase: 2026-10-29T20:00:00-07:00
export function formatClientTime(date: Date): string {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${toDayKey(date)}T${time}${formatUtcOffset(date.getTimezoneOffset())}`;
}

export function buildClientTimeHeaders(
  now: Date = new Date(),
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
): ClientTimeHeaders {
  return { 'X-Client-Time': formatClientTime(now), 'X-Timezone': timeZone };
}
