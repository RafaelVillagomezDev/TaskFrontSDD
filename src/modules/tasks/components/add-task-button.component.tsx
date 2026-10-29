import { Plus } from 'lucide-react';

import { formatDayLong } from '../../../shared/date/date-format.util';
import { Button } from '../../../shared/ui/button.component';
import { Icon } from '../../../shared/ui/icon.component';
import { TASKS_TEXTS } from '../texts/tasks.texts';

interface AddTaskButtonProps {
  day: string;
  onAdd: (day: string) => void;
}

// «Añadir tarea» al final de una columna (DESIGN.md Board Columns): ancho de la columna, borde discontinuo
// y 32 px de alto desde md (44 px en móvil). El nombre accesible incluye el día (RF-15)
export function AddTaskButton({ day, onAdd }: Readonly<AddTaskButtonProps>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={TASKS_TEXTS.column.addTaskFor(formatDayLong(day))}
      className="w-full border border-dashed border-border bg-surface text-foreground-muted"
      onClick={() => {
        onAdd(day);
      }}
    >
      <Icon icon={Plus} />
      {TASKS_TEXTS.column.addTask}
    </Button>
  );
}
