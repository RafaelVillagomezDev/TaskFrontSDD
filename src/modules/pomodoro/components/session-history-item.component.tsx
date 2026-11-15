import { Link } from 'react-router';

import { formatDateTime } from '@shared/date/date-format.util';
import { pomodoroSessionPath, ROUTES } from '@shared/router/routes.constants';
import { Badge } from '@shared/ui/badge.component';
import { Text } from '@shared/ui/text.component';
import type { Pomodoro } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS, sessionOutcome } from '../texts/pomodoro.texts';

interface SessionHistoryItemProps {
  session: Pomodoro;
}

const { history: texts, session: sessionTexts } = POMODORO_TEXTS;

// Una sesión del historial (RF-39): fecha de inicio (enlace al detalle, RF-54), duración, motivo de fin,
// concentración y «X de Y». La sesión activa aún no tiene resultado: se marca «En curso» o «En pausa» y su enlace
// lleva a la sesión en marcha
export function SessionHistoryItem({ session }: Readonly<SessionHistoryItemProps>) {
  const finished = session.status === 'finished';
  const date = formatDateTime(session.startedAt);
  return (
    <li className="flex flex-col gap-1 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          to={finished ? pomodoroSessionPath(session.id) : ROUTES.pomodoro}
          className="focus-ring inline-flex min-h-touch items-center text-body font-semibold text-primary-text underline-offset-4 hover:underline"
        >
          <span className="sr-only">{texts.openPrefix}</span>
          <span>{date}</span>
        </Link>
        {!finished && (
          <Badge variant="primary">{session.status === 'paused' ? texts.paused : texts.running}</Badge>
        )}
      </div>
      <Text variant="body-sm" tone="muted">
        {texts.duration(session.durationMinutes)}
      </Text>
      {finished && (
        <Text variant="body-sm" tone="muted">
          {sessionOutcome(session.endReason, session.focusedSeconds)}
        </Text>
      )}
      <Text variant="body-sm">{sessionTexts.summary(session.completedTasks, session.totalTasks)}</Text>
    </li>
  );
}
