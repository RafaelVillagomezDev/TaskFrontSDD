import { Button } from '../../../shared/ui/button.component';
import { DateInput } from '../../../shared/ui/date-input.component';
import { SelectNative } from '../../../shared/ui/select-native.component';
import type { History } from '../hooks/use-history.hook';
import type { HistoryStatus } from '../schemas/history-filters.schema';
import { TASKS_TEXTS } from '../texts/tasks.texts';

interface HistoryFiltersProps {
  history: History;
}

const { history: texts } = TASKS_TEXTS;

const STATUS_OPTIONS: readonly HistoryStatus[] = ['all', 'completed', 'pending'];

// Filtros del historial (RF-32, RF-33): estado y rango de fechas; cada error bajo su campo y nada se aplica
// hasta que son válidos. Los campos en una columna en móvil y en fila desde md; las acciones debajo
export function HistoryFilters({ history }: Readonly<HistoryFiltersProps>) {
  const { form } = history;
  const { errors } = form.formState;
  return (
    <form noValidate aria-label={texts.filters} onSubmit={history.onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3 md:items-start">
        <SelectNative {...form.register('status')} label={texts.status}>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {texts.statusOptions[status]}
            </option>
          ))}
        </SelectNative>
        <DateInput {...form.register('from')} label={texts.from} errorText={errors.from?.message} />
        <DateInput {...form.register('to')} label={texts.to} errorText={errors.to?.message} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">{texts.apply}</Button>
        {history.isFiltered && (
          <Button variant="ghost" onClick={history.clearFilters}>
            {texts.clear}
          </Button>
        )}
      </div>
    </form>
  );
}
