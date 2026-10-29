// Días de calendario locales con el formato de la API: AAAA-MM-DD (plan D-4)
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_OFFSET = 1;
const PAD_LENGTH = 2;

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, '0');
}

function toParts(day: string): { year: number; month: number; date: number } | null {
  const match = DAY_KEY_PATTERN.exec(day);
  if (match === null) return null;
  const [, year = '', month = '', date = ''] = match;
  return { year: Number(year), month: Number(month), date: Number(date) };
}

// Fecha local del dispositivo; nunca toISOString(), que da el día en UTC
export function toDayKey(date: Date): string {
  return `${String(date.getFullYear())}-${pad(date.getMonth() + MONTH_OFFSET)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDayKey(now);
}

export function isDayKey(value: string): boolean {
  const parts = toParts(value);
  if (parts === null) return false;
  const date = new Date(parts.year, parts.month - MONTH_OFFSET, parts.date);
  return toDayKey(date) === value;
}

// Medianoche local del día
export function parseDayKey(day: string): Date {
  const parts = toParts(day);
  if (parts === null || !isDayKey(day)) {
    throw new Error(`Día no válido: ${day}`);
  }
  return new Date(parts.year, parts.month - MONTH_OFFSET, parts.date);
}

// Aritmética sobre la fecha local: el cambio de horario de verano no mueve el día
export function addDays(day: string, amount: number): string {
  const date = parseDayKey(day);
  date.setDate(date.getDate() + amount);
  return toDayKey(date);
}

// El formato AAAA-MM-DD se ordena igual como texto que como fecha
export function compareDays(a: string, b: string): number {
  return a.localeCompare(b);
}

export function dayRange(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}
