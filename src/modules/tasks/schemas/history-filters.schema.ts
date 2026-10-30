import { z } from 'zod';

import { compareDays, isDayKey } from '../../../shared/date/day.util';
import { TASKS_TEXTS } from '../texts/tasks.texts';

const { validation } = TASKS_TEXTS;

// Estado por el que se filtra el historial (API-001 RF-10)
export const historyStatusSchema = z.enum(['all', 'completed', 'pending']);

export type HistoryStatus = z.infer<typeof historyStatusSchema>;

// Día opcional: vacío o AAAA-MM-DD válido
const optionalDay = z.string().refine((day) => day === '' || isDayKey(day), validation.dateInvalid);

// Filtros del historial (plan §5.6, RF-32, RF-33, RF-46): «desde» y «hasta» opcionales, ambos incluidos, y «desde»
// no posterior a «hasta». El error se muestra en «desde» y el filtro no se aplica
export const historyFiltersSchema = z
  .object({ status: historyStatusSchema, from: optionalDay, to: optionalDay })
  .refine((filters) => filters.from === '' || filters.to === '' || compareDays(filters.from, filters.to) <= 0, {
    message: validation.rangeInvalid,
    path: ['from'],
  });

export type HistoryFilters = z.infer<typeof historyFiltersSchema>;

export const NO_HISTORY_FILTERS: HistoryFilters = { status: 'all', from: '', to: '' };
