import { Plus } from 'lucide-react';

import { PageContainer } from '../../../shared/layout/page-container.layout';
import { PageHeader } from '../../../shared/layout/page-header.component';
import { Button } from '../../../shared/ui/button.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Icon } from '../../../shared/ui/icon.component';
import { Notice } from '../../../shared/ui/notice.component';
import { Spinner } from '../../../shared/ui/spinner.component';
import { AddTaskButton } from '../components/add-task-button.component';
import { DayColumn } from '../components/day-column.component';
import { TaskFormDialog } from '../components/task-form-dialog.component';
import { WeekNavigator } from '../components/week-navigator.component';
import { useTaskForm } from '../hooks/use-task-form.hook';
import { useWeekBoard } from '../hooks/use-week-board.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';

type WeekBoard = ReturnType<typeof useWeekBoard>;

interface BoardContentProps {
  board: WeekBoard;
  // Abre el formulario de crear con la fecha de la columna (RF-15)
  onAddTask: (day: string) => void;
}

// Zona del tablero: carga y error solo aquí, sin bloquear el resto de la pantalla (RF-40, RF-44)
function BoardContent({ board, onAddTask }: Readonly<BoardContentProps>) {
  if (board.status === 'loading') return <Spinner />;
  if (board.status === 'error') {
    return <ErrorMessage message={board.errorMessage ?? ''} onRetry={board.retry} />;
  }
  return (
    // Las columnas de 264 px se desplazan solo dentro del tablero (CONSTITUTION.md VII.5, excepción).
    // Chrome y Firefox (RNF-04) hacen enfocable con teclado una zona desplazable sin controles (RNF-02)
    <section aria-label={TASKS_TEXTS.board.region} className="focus-ring flex gap-6 overflow-x-auto rounded-md pb-4">
      {board.columns.map((column) => (
        <DayColumn key={column.day} column={column}>
          <AddTaskButton day={column.day} onAdd={onAddTask} />
        </DayColumn>
      ))}
    </section>
  );
}

// Tablero semanal en / (RF-09 a RF-19, RF-47, RF-51, RF-52; plan §6.2)
export function BoardPage() {
  const board = useWeekBoard();
  const taskForm = useTaskForm({ today: board.today, weekStart: board.weekStart, weekEnd: board.weekEnd });
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
          {/* Botón general: propone la fecha de hoy (RF-51) */}
          <Button
            onClick={() => {
              taskForm.openFor(board.today);
            }}
          >
            <Icon icon={Plus} />
            {TASKS_TEXTS.board.newTask}
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      {taskForm.notice !== undefined && <Notice>{taskForm.notice}</Notice>}
      <BoardContent board={board} onAddTask={taskForm.openFor} />
      <TaskFormDialog taskForm={taskForm} />
    </PageContainer>
  );
}
