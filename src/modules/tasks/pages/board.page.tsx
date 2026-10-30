import { Plus } from 'lucide-react';

import { PageContainer } from '../../../shared/layout/page-container.layout';
import { PageHeader } from '../../../shared/layout/page-header.component';
import { Button } from '../../../shared/ui/button.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Icon } from '../../../shared/ui/icon.component';
import { Notice } from '../../../shared/ui/notice.component';
import { Spinner } from '../../../shared/ui/spinner.component';
import { TodaysAlertBanner, useTodaysAlert } from '../../alerts';
import { StreakPanel, useStreakPanel } from '../../streaks';
import { AddTaskButton } from '../components/add-task-button.component';
import { DayColumn } from '../components/day-column.component';
import { DeleteTaskDialog } from '../components/delete-task-dialog.component';
import { TaskFormDialog } from '../components/task-form-dialog.component';
import { WeekNavigator } from '../components/week-navigator.component';
import { useTaskActions, type TaskCardActions } from '../hooks/use-task-actions.hook';
import { useTaskForm } from '../hooks/use-task-form.hook';
import { useWeekBoard } from '../hooks/use-week-board.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';

type WeekBoard = ReturnType<typeof useWeekBoard>;

interface BoardContentProps {
  board: WeekBoard;
  // Abre el formulario de crear con la fecha de la columna (RF-15)
  onAddTask: (day: string) => void;
  actions: TaskCardActions;
}

// Zona del tablero: carga y error solo aquí, sin bloquear el resto de la pantalla (RF-40, RF-44)
function BoardContent({ board, onAddTask, actions }: Readonly<BoardContentProps>) {
  if (board.status === 'loading') return <Spinner />;
  if (board.status === 'error') {
    return <ErrorMessage message={board.errorMessage ?? ''} onRetry={board.retry} />;
  }
  return (
    // Las columnas de 264 px se desplazan solo dentro del tablero (CONSTITUTION.md VII.5, excepción).
    // Chrome y Firefox (RNF-04) hacen enfocable con teclado una zona desplazable sin controles (RNF-02)
    <section aria-label={TASKS_TEXTS.board.region} className="focus-ring flex gap-6 overflow-x-auto rounded-md pb-4">
      {board.columns.map((column) => (
        <DayColumn key={column.day} column={column} actions={actions}>
          <AddTaskButton day={column.day} onAdd={onAddTask} />
        </DayColumn>
      ))}
    </section>
  );
}

// Tablero semanal en / con el panel de racha y progreso de hoy y el aviso de hoy (RF-09 a RF-30, RF-37, RF-47, RF-51, RF-52; plan §6.2)
export function BoardPage() {
  const board = useWeekBoard();
  const taskForm = useTaskForm({ today: board.today, weekStart: board.weekStart, weekEnd: board.weekEnd });
  const actions = useTaskActions(taskForm.openEdit);
  const streakPanel = useStreakPanel(board.todayProgress);
  const todaysAlert = useTodaysAlert();
  const createTodayTask = () => {
    taskForm.openFor(board.today);
  };
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
          <Button onClick={createTodayTask}>
            <Icon icon={Plus} />
            {TASKS_TEXTS.board.newTask}
          </Button>
        </PageHeader.Actions>
      </PageHeader>
      {/* Debajo de la cabecera (S-10, plan §6.2); «Crear una tarea» propone hoy, como «Nueva tarea» (RF-28) */}
      <StreakPanel panel={streakPanel} onCreateTask={createTodayTask} />
      {/* El aviso generado hoy, si lo hay (RF-37) */}
      {todaysAlert !== undefined && <TodaysAlertBanner alert={todaysAlert} />}
      {taskForm.notice !== undefined && <Notice onDismiss={taskForm.dismissNotice}>{taskForm.notice}</Notice>}
      {actions.error !== undefined && (
        <ErrorMessage message={actions.error} onRetry={actions.retry} onDismiss={actions.dismissError} />
      )}
      <BoardContent board={board} onAddTask={taskForm.openFor} actions={actions} />
      <TaskFormDialog taskForm={taskForm} />
      <DeleteTaskDialog deletion={actions} />
    </PageContainer>
  );
}
