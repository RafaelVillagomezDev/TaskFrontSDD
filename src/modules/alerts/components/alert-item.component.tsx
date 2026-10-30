import { formatDayLong, formatShortDate, formatTime } from '../../../shared/date/date-format.util';
import { toDayKey } from '../../../shared/date/day.util';
import { Badge } from '../../../shared/ui/badge.component';
import { Text } from '../../../shared/ui/text.component';
import type { Alert } from '../schemas/alert.schema';
import { ALERTS_TEXTS } from '../texts/alerts.texts';

interface AlertItemProps {
  alert: Alert;
}

const { item: texts } = ALERTS_TEXTS;

// Un día para el aviso diario; del inicio al fin del periodo para el semanal y el mensual
function periodOf(alert: Alert): string {
  if (alert.periodStart === alert.periodEnd) return formatDayLong(alert.periodStart);
  return texts.period(formatShortDate(alert.periodStart), formatShortDate(alert.periodEnd));
}

// Un aviso (RF-35, RF-36): tipo, periodo, cuándo se generó y sus tareas tal como estaban, con la nota de que
// pueden haber cambiado. Tarjeta plana como las del tablero (DESIGN.md Task Card); el tipo, con badge Warning
export function AlertItem({ alert }: Readonly<AlertItemProps>) {
  const createdAt = new Date(alert.createdAt);
  return (
    <li className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge variant="warning">{ALERTS_TEXTS.type[alert.type]}</Badge>
        <Text as="h2" variant="body" className="font-semibold first-letter:uppercase">
          {periodOf(alert)}
        </Text>
        <Badge variant="outline">{texts.tasksCount(alert.tasks.length)}</Badge>
      </div>
      <Text variant="caption" tone="muted">
        <time dateTime={alert.createdAt}>
          {texts.createdAt(formatShortDate(toDayKey(createdAt)), formatTime(createdAt))}
        </time>
      </Text>
      <ul aria-label={texts.tasks} className="flex flex-col gap-2">
        {alert.tasks.map((task) => (
          <li
            key={task.id}
            className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-border pt-2"
          >
            <Text as="span" variant="body-sm" dir="auto" className="min-w-0 font-medium break-words">
              {task.title}
            </Text>
            <Text as="span" variant="caption" tone="muted" className="tabular-nums">
              <time dateTime={task.date}>{formatShortDate(task.date)}</time>
            </Text>
          </li>
        ))}
      </ul>
      <Text variant="caption" tone="muted">
        {texts.snapshotNote}
      </Text>
    </li>
  );
}
