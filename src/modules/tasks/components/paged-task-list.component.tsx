import type { ReactNode } from 'react';

import { formatDayLong } from '@shared/date/date-format.util';
import { EmptyState } from '@shared/layout/empty-state.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Pagination } from '@shared/ui/pagination.component';
import { Spinner } from '@shared/ui/spinner.component';
import { Text } from '@shared/ui/text.component';
import { TASKS_TEXTS } from '../texts/tasks.texts';
import type { PagedTasks } from '../types/paged-tasks.types';
import { TaskCard } from './task-card.component';

// history: cada tarea con su fecha (001 RF-31); taskDay: sin fecha, todas son de hoy (002 RF-02)
export type PagedTaskListVariant = 'history' | 'taskDay';

interface PagedTaskListProps {
  list: PagedTasks;
  variant: PagedTaskListVariant;
  // Estado vacío propio de cada pantalla (002 RF-04)
  children: ReactNode;
}

// Lista paginada de tareas en solo lectura (plan 002 D-2): sin completar, editar ni eliminar, en el orden de la API,
// con la página y sus totales. Carga y error solo en esta zona (001 RF-40, RF-44)
export function PagedTaskList({ list, variant, children }: Readonly<PagedTaskListProps>) {
  const texts = TASKS_TEXTS[variant];
  if (list.status === 'loading') return <Spinner />;
  if (list.status === 'error') return <ErrorMessage message={list.errorMessage ?? ''} onRetry={list.retry} />;
  if (list.tasks.length === 0) return <EmptyState>{children}</EmptyState>;
  return (
    <div className="flex flex-col gap-6">
      <ul aria-label={texts.list} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.tasks.map((task) => (
          <TaskCard key={task.id} task={task} variant="list">
            {variant === 'history' && (
              <Text as="p" variant="caption" tone="muted" className="w-full first-letter:uppercase">
                <time dateTime={task.date}>{formatDayLong(task.date)}</time>
              </Text>
            )}
          </TaskCard>
        ))}
      </ul>
      <Pagination page={list.page} totalPages={list.totalPages} onPageChange={list.goToPage}>
        {texts.total(list.totalItems)}
      </Pagination>
    </div>
  );
}
