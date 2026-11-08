import { Text } from '@shared/ui/text.component';
import type { History } from '../hooks/use-history.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';
import { PagedTaskList } from './paged-task-list.component';

interface HistoryListProps {
  history: History;
}

const { history: texts } = TASKS_TEXTS;

// Lista del historial (RF-31, RF-34): cada tarea con su fecha y su estado, en el orden de la API, y la página con
// sus totales. El estado vacío distingue si hay filtros
export function HistoryList({ history }: Readonly<HistoryListProps>) {
  return (
    <PagedTaskList list={history} variant="history">
      <Text variant="body-sm" tone="muted">
        {history.isFiltered ? texts.empty : texts.noTasks}
      </Text>
    </PagedTaskList>
  );
}
