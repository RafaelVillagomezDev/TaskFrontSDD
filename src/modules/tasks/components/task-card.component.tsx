import { Badge } from '../../../shared/ui/badge.component';
import { Box } from '../../../shared/ui/box.component';
import { Text } from '../../../shared/ui/text.component';
import { cn } from '../../../shared/utils/class-names.util';
import type { Task } from '../schemas/task.schema';
import { TASKS_TEXTS } from '../texts/tasks.texts';

interface TaskCardProps {
  task: Task;
}

// Tarjeta de DESIGN.md (Task Card): superficie con borde, radius-md, space-4 y sin sombra en reposo.
// El título ocupa como mucho 2 líneas y parte las palabras largas para no desbordar la columna (RNF-03)
export function TaskCard({ task }: Readonly<TaskCardProps>) {
  return (
    <Box as="li" className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <Text
        variant="body-sm"
        className={cn('line-clamp-2 font-medium break-words', task.completed && 'text-foreground-muted line-through')}
      >
        {task.title}
      </Text>
      {task.description !== null && (
        <Text variant="caption" tone="muted" className="line-clamp-2 break-words">
          {task.description}
        </Text>
      )}
      {/* Estado con las variantes de DESIGN.md (Status → Badge Mapping) */}
      <div className="flex flex-wrap gap-2">
        {task.completed ? (
          <Badge variant="success">{TASKS_TEXTS.status.completed}</Badge>
        ) : (
          <Badge>{TASKS_TEXTS.status.pending}</Badge>
        )}
      </div>
    </Box>
  );
}
