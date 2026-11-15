import { Pencil, Trash2 } from 'lucide-react';

import { formatShortDate } from '@shared/date/date-format.util';
import { Button } from '@shared/ui/button.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Icon } from '@shared/ui/icon.component';
import { Pagination } from '@shared/ui/pagination.component';
import { Text } from '@shared/ui/text.component';
import type { WaitingTasks } from '../hooks/use-waiting-tasks.hook';
import type { PomodoroTask } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface WaitingTaskListProps {
  waiting: WaitingTasks;
  onEdit: (task: PomodoroTask) => void;
}

const { waiting: texts } = POMODORO_TEXTS;

// Tareas en espera bajo la sesión o el formulario (RF-32 a RF-37, RF-52): título, descripción, fecha (o que tomará la
// de hoy), editar y borrar; sin casilla de completar, porque solo se completan dentro de una sesión (RF-34). Sin
// tareas en espera no se muestra
export function WaitingTaskList({ waiting, onEdit }: Readonly<WaitingTaskListProps>) {
  if (waiting.errorMessage !== undefined) {
    return <ErrorMessage message={waiting.errorMessage} onRetry={waiting.retry} />;
  }
  if (waiting.items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text as="h2" variant="h4">
          {texts.title}
        </Text>
        <Text variant="body-sm" tone="muted">
          {texts.help}
        </Text>
      </div>
      {waiting.actionError !== undefined && (
        <ErrorMessage message={waiting.actionError} onDismiss={waiting.dismissError} />
      )}
      <ul aria-label={texts.list} className="flex flex-col divide-y divide-border rounded-md border border-border">
        {waiting.items.map(({ task, takesToday }) => (
          <li key={task.id} className="flex items-start gap-2 p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Text variant="body" className="break-words">
                {task.title}
              </Text>
              {task.description !== null && (
                <Text variant="body-sm" tone="muted" className="break-words">
                  {task.description}
                </Text>
              )}
              <Text variant="caption" tone="muted">
                {takesToday ? texts.takesToday : texts.date(formatShortDate(task.date))}
              </Text>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={texts.edit(task.title)}
              onClick={() => {
                onEdit(task);
              }}
            >
              <Icon icon={Pencil} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={texts.delete(task.title)}
              onClick={() => {
                waiting.requestDelete(task);
              }}
            >
              <Icon icon={Trash2} />
            </Button>
          </li>
        ))}
      </ul>
      <Pagination page={waiting.page} totalPages={waiting.totalPages} onPageChange={waiting.goToPage}>
        {texts.total(waiting.totalItems)}
      </Pagination>
    </section>
  );
}
