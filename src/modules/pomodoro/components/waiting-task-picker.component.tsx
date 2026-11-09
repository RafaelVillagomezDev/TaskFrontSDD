import { Checkbox } from '@shared/ui/checkbox.component';
import { Text } from '@shared/ui/text.component';
import { formatShortDate } from '@shared/date/date-format.util';
import type { NewTaskRows } from '../hooks/use-new-task-rows.hook';
import type { WaitingItem } from '../hooks/use-waiting-tasks.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface WaitingTaskPickerProps {
  items: WaitingItem[];
  rows: NewTaskRows;
}

const { waiting: texts } = POMODORO_TEXTS;

// Elegir tareas en espera para incluirlas al empezar o al añadir (RF-12, RF-29): casillas con el título y la fecha,
// y el aviso de que una con fecha pasada tomará la de hoy (RF-37). Al llegar a 20 no se pueden elegir más (RF-13)
export function WaitingTaskPicker({ items, rows }: Readonly<WaitingTaskPickerProps>) {
  if (items.length === 0) return null;
  return (
    <fieldset className="flex flex-col gap-2">
      <Text as="legend" variant="body-sm" className="mb-2 font-medium">
        {texts.pick}
      </Text>
      {items.map(({ task, takesToday }) => (
        <label key={task.id} className="flex items-start gap-3">
          <Checkbox
            checked={rows.isWaitingSelected(task.id)}
            disabled={!rows.canSelectWaiting(task.id)}
            onChange={() => {
              rows.toggleWaiting(task.id);
            }}
          />
          <span className="flex min-w-0 flex-col pt-2 md:pt-0">
            <Text as="span" variant="body" className="break-words">
              {task.title}
            </Text>
            <Text as="span" variant="body-sm" tone="muted">
              {takesToday ? texts.takesToday : texts.date(formatShortDate(task.date))}
            </Text>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
