import { parseDayKey } from './day.util';

// Formatos en español (spec S-03)
const LOCALE = 'es-ES';

const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
const longDateFormat = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatWeekday(day: string): string {
  return weekdayFormat.format(parseDayKey(day));
}

export function formatShortDate(day: string): string {
  return shortDateFormat.format(parseDayKey(day));
}

export function formatDayLong(day: string): string {
  return longDateFormat.format(parseDayKey(day));
}
