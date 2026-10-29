import { PageContainer } from '../../../shared/layout/page-container.layout';
import { PageHeader } from '../../../shared/layout/page-header.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Spinner } from '../../../shared/ui/spinner.component';
import { DayColumn } from '../components/day-column.component';
import { WeekNavigator } from '../components/week-navigator.component';
import { useWeekBoard } from '../hooks/use-week-board.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';

type WeekBoard = ReturnType<typeof useWeekBoard>;

interface BoardContentProps {
  board: WeekBoard;
}

// Zona del tablero: carga y error solo aquí, sin bloquear el resto de la pantalla (RF-40, RF-44)
function BoardContent({ board }: Readonly<BoardContentProps>) {
  if (board.status === 'loading') return <Spinner />;
  if (board.status === 'error') {
    return <ErrorMessage message={board.errorMessage ?? ''} onRetry={board.retry} />;
  }
  return (
    // Las columnas de 264 px se desplazan solo dentro del tablero (CONSTITUTION.md VII.5, excepción).
    // Chrome y Firefox (RNF-04) hacen enfocable con teclado una zona desplazable sin controles (RNF-02)
    <section aria-label={TASKS_TEXTS.board.region} className="focus-ring flex gap-6 overflow-x-auto rounded-md pb-4">
      {board.columns.map((column) => (
        <DayColumn key={column.day} column={column} />
      ))}
    </section>
  );
}

// Tablero semanal en / (RF-09 a RF-14, RF-47; plan §6.2)
export function BoardPage() {
  const board = useWeekBoard();
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Title>{TASKS_TEXTS.board.title}</PageHeader.Title>
        <PageHeader.Actions>
          <WeekNavigator
            weekStart={board.weekStart}
            weekEnd={board.weekEnd}
            onPrevious={board.goToPreviousWeek}
            onNext={board.goToNextWeek}
            onToday={board.goToToday}
          />
        </PageHeader.Actions>
      </PageHeader>
      <BoardContent board={board} />
    </PageContainer>
  );
}
