import { formatDayLong } from '../../../shared/date/date-format.util';
import { EmptyState } from '../../../shared/layout/empty-state.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Pagination } from '../../../shared/ui/pagination.component';
import { Spinner } from '../../../shared/ui/spinner.component';
import { Text } from '../../../shared/ui/text.component';
import type { History } from '../hooks/use-history.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';
import { TaskCard } from './task-card.component';

interface HistoryListProps {
  history: History;
}

const { history: texts } = TASKS_TEXTS;

// Lista del historial (RF-31, RF-34): cada tarea con su fecha y su estado, en el orden de la API, y la página con
// sus totales. Carga y error solo en esta zona (RF-40, RF-44)
export function HistoryList({ history }: Readonly<HistoryListProps>) {
  if (history.status === 'loading') return <Spinner />;
  if (history.status === 'error') {
    return <ErrorMessage message={history.errorMessage ?? ''} onRetry={history.retry} />;
  }
  if (history.tasks.length === 0) {
    return (
      <EmptyState>
        <Text variant="body-sm" tone="muted">
          {history.isFiltered ? texts.empty : texts.noTasks}
        </Text>
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <ul aria-label={texts.list} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {history.tasks.map((task) => (
          <TaskCard key={task.id} task={task} variant="list">
            <Text as="p" variant="caption" tone="muted" className="w-full first-letter:uppercase">
              <time dateTime={task.date}>{formatDayLong(task.date)}</time>
            </Text>
          </TaskCard>
        ))}
      </ul>
      <Pagination page={history.page} totalPages={history.totalPages} onPageChange={history.goToPage}>
        {texts.total(history.totalItems)}
      </Pagination>
    </div>
  );
}
