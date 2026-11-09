import { Link } from 'react-router';

import { EmptyState } from '@shared/layout/empty-state.component';
import { ROUTES } from '@shared/router/routes.constants';
import { Button } from '@shared/ui/button.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Pagination } from '@shared/ui/pagination.component';
import { Spinner } from '@shared/ui/spinner.component';
import { Text } from '@shared/ui/text.component';
import { SessionHistoryItem } from '../components/session-history-item.component';
import { useSessionHistory, type SessionHistory } from '../hooks/use-session-history.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

const { history: texts } = POMODORO_TEXTS;

function HistoryContent({ history }: Readonly<{ history: SessionHistory }>) {
  if (history.status === 'loading') return <Spinner />;
  if (history.status === 'error') {
    return <ErrorMessage message={history.errorMessage ?? ''} onRetry={history.retry} />;
  }
  if (history.sessions.length === 0) {
    return (
      <EmptyState>
        <Text variant="body-sm" tone="muted">
          {texts.empty}
        </Text>
        <Button as={Link} to={ROUTES.pomodoro} variant="secondary" size="sm">
          {texts.startFirst}
        </Button>
      </EmptyState>
    );
  }
  return (
    <>
      <ul aria-label={texts.list} className="flex flex-col divide-y divide-border rounded-md border border-border">
        {history.sessions.map((session) => (
          <SessionHistoryItem key={session.id} session={session} />
        ))}
      </ul>
      <Pagination page={history.page} totalPages={history.totalPages} onPageChange={history.goToPage}>
        {texts.total(history.totalItems)}
      </Pagination>
    </>
  );
}

// Historial de sesiones en /pomodoro/history (RF-38, RF-39, RF-53), bajo la cabecera y la subnavegación del pomodoro
export function PomodoroHistoryPage() {
  const history = useSessionHistory();
  return (
    <section className="flex flex-col gap-4">
      <Text as="h2" variant="h4">
        {texts.title}
      </Text>
      <HistoryContent history={history} />
    </section>
  );
}
