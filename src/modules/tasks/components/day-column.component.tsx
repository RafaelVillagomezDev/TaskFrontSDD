import type { ReactNode } from 'react';

import { formatDayLong, formatShortDate, formatWeekday } from '../../../shared/date/date-format.util';
import { BoardColumn } from '../../../shared/layout/board-column.component';
import { EmptyState } from '../../../shared/layout/empty-state.component';
import { Badge } from '../../../shared/ui/badge.component';
import { Text } from '../../../shared/ui/text.component';
import type { TaskCardActions } from '../hooks/use-task-actions.hook';
import type { DayColumnModel, DayKind } from '../hooks/use-week-board.hook';
import type { Task } from '../schemas/task.schema';
import { TASKS_TEXTS } from '../texts/tasks.texts';
import { TaskCard } from './task-card.component';

interface DayColumnProps {
  column: DayColumnModel;
  // Acciones del día (crear una tarea): solo se muestran si el día no está cerrado (RF-11, RF-13)
  children?: ReactNode;
  // Acciones sobre las tareas: completar solo hoy (RF-20 a RF-22) y eliminar hoy y días futuros (RF-23);
  // un día cerrado no ofrece ninguna (RF-13)
  actions?: TaskCardActions | undefined;
}

interface TaskListProps {
  label: string;
  tasks: Task[];
  kind: DayKind;
  actions: TaskCardActions | undefined;
}

function TaskList({ label, tasks, kind, actions }: Readonly<TaskListProps>) {
  if (tasks.length === 0) return null;
  const canComplete = actions !== undefined && kind === 'today';
  const canDelete = actions !== undefined && kind !== 'past';
  return (
    <BoardColumn.List aria-label={label}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleCompleted={
            canComplete
              ? () => {
                  actions.toggleCompleted(task);
                }
              : undefined
          }
          isUpdating={actions?.isUpdating(task.id)}
          keepFocus={actions?.keepsFocus(task.id)}
          onDelete={
            canDelete
              ? () => {
                  actions.requestDelete(task);
                }
              : undefined
          }
        />
      ))}
    </BoardColumn.List>
  );
}

// Columna de un día del tablero sobre BoardColumn (RF-09 a RF-11, RF-13)
export function DayColumn({ column, children, actions }: Readonly<DayColumnProps>) {
  const isClosed = column.kind === 'past';
  return (
    <BoardColumn aria-label={formatDayLong(column.day)}>
      <BoardColumn.Header>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="capitalize">
            <BoardColumn.Title>{formatWeekday(column.day)}</BoardColumn.Title>
          </div>
          <Text variant="caption" tone="muted">
            {formatShortDate(column.day)}
          </Text>
        </div>
        {column.kind === 'today' && <Badge variant="primary">{TASKS_TEXTS.column.today}</Badge>}
        {isClosed && <Badge>{TASKS_TEXTS.column.closed}</Badge>}
        <Badge variant="outline">{TASKS_TEXTS.column.count(column.total)}</Badge>
      </BoardColumn.Header>
      {column.total === 0 && (
        <EmptyState>
          <Text variant="body-sm" tone="muted">
            {TASKS_TEXTS.column.empty}
          </Text>
        </EmptyState>
      )}
      <TaskList label={TASKS_TEXTS.column.pending} tasks={column.pending} kind={column.kind} actions={actions} />
      <TaskList label={TASKS_TEXTS.column.completed} tasks={column.completed} kind={column.kind} actions={actions} />
      {!isClosed && children}
    </BoardColumn>
  );
}
