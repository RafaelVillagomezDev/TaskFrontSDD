import { Link } from 'react-router';
import { ArrowLeft, Circle, CircleCheck } from 'lucide-react';

import { formatDateTime } from '@shared/date/date-format.util';
import { EmptyState } from '@shared/layout/empty-state.component';
import { ROUTES } from '@shared/router/routes.constants';
import { Button } from '@shared/ui/button.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Icon } from '@shared/ui/icon.component';
import { Spinner } from '@shared/ui/spinner.component';
import { Text } from '@shared/ui/text.component';
import { useSessionDetail } from '../hooks/use-session-detail.hook';
import type { Pomodoro } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS, sessionOutcome } from '../texts/pomodoro.texts';

const { detail: texts, history: historyTexts, session: sessionTexts } = POMODORO_TEXTS;

// Tareas de la sesión tal como quedaron al terminar, en solo lectura (RF-40): sin casillas ni acciones. El estado
// se lee antes del título para los lectores de pantalla; a la vista lo da el icono
function SessionTasks({ session }: Readonly<{ session: Pomodoro }>) {
  if (session.tasks.length === 0) {
    return (
      <Text variant="body-sm" tone="muted">
        {texts.noTasks}
      </Text>
    );
  }
  return (
    <ul aria-label={texts.tasks} className="flex flex-col divide-y divide-border rounded-md border border-border">
      {session.tasks.map((task) => (
        <li key={task.id} className="flex items-start gap-3 p-3">
          <span className={task.completed ? 'text-success' : 'text-foreground-muted'}>
            <Icon icon={task.completed ? CircleCheck : Circle} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Text variant="body" className="break-words">
              <span className="sr-only">{task.completed ? texts.completed : texts.pending}</span>
              {task.title}
            </Text>
            {task.description !== null && (
              <Text variant="body-sm" tone="muted" className="break-words">
                {task.description}
              </Text>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// Una sesión terminada: fecha, duración, cómo terminó, «X de Y» y sus tareas (RF-39, RF-40)
function FinishedSession({ session }: Readonly<{ session: Pomodoro }>) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <Text as="h2" variant="h4">
          {formatDateTime(session.startedAt)}
        </Text>
        <Text variant="body-sm" tone="muted">
          {historyTexts.duration(session.durationMinutes)}
        </Text>
        <Text variant="body-sm" tone="muted">
          {sessionOutcome(session.endReason, session.focusedSeconds)}
        </Text>
        <Text variant="body" className="font-semibold">
          {sessionTexts.summary(session.completedTasks, session.totalTasks)}
        </Text>
      </div>
      <SessionTasks session={session} />
    </>
  );
}

function DetailContent() {
  const detail = useSessionDetail();
  if (detail.status === 'loading') return <Spinner label={texts.loading} />;
  if (detail.status === 'error') return <ErrorMessage message={detail.errorMessage ?? ''} onRetry={detail.retry} />;
  if (detail.status === 'notFound' || detail.session === undefined) {
    // Sesión inexistente o de otro usuario (RF-49): acceso a la sección del pomodoro
    return (
      <EmptyState>
        <Text variant="body" className="font-semibold">
          {texts.notFound}
        </Text>
        <Text variant="body-sm" tone="muted">
          {texts.notFoundHelp}
        </Text>
        <Button as={Link} to={ROUTES.pomodoro} variant="secondary" size="sm">
          {texts.goToPomodoro}
        </Button>
      </EmptyState>
    );
  }
  if (detail.session.status !== 'finished') {
    return (
      <EmptyState>
        <Text variant="body-sm" tone="muted">
          {texts.stillActive}
        </Text>
        <Button as={Link} to={ROUTES.pomodoro} variant="secondary" size="sm">
          {texts.goToSession}
        </Button>
      </EmptyState>
    );
  }
  return <FinishedSession session={detail.session} />;
}

// Detalle de una sesión en /pomodoro/history/:id (RF-40, RF-49, RF-54), con la vuelta al historial
export function PomodoroSessionDetailPage() {
  return (
    <section className="flex flex-col gap-4">
      <Button as={Link} to={ROUTES.pomodoroHistory} variant="link" className="min-h-touch self-start">
        <Icon icon={ArrowLeft} />
        {texts.back}
      </Button>
      <DetailContent />
    </section>
  );
}
