import type { ReactNode } from 'react';

import { formatDayLong, formatShortDate, formatWeekday } from '../../../shared/date/date-format.util';
import { BoardColumn } from '../../../shared/layout/board-column.component';
import { EmptyState } from '../../../shared/layout/empty-state.component';
import { Badge } from '../../../shared/ui/badge.component';
import { Text } from '../../../shared/ui/text.component';
import type { DayColumnModel } from '../hooks/use-week-board.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';
import { TaskCard } from './task-card.component';

interface DayColumnProps {
  column: DayColumnModel;
  // Acciones del día (crear una tarea): solo se muestran si el día no está cerrado (RF-11, RF-13)
  children?: ReactNode;
}

// Columna de un día del tablero sobre BoardColumn (RF-09 a RF-11, RF-13)
export function DayColumn({ column, children }: Readonly<DayColumnProps>) {
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
      {column.pending.length > 0 && (
        <BoardColumn.List aria-label={TASKS_TEXTS.column.pending}>
          {column.pending.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </BoardColumn.List>
      )}
      {column.completed.length > 0 && (
        <BoardColumn.List aria-label={TASKS_TEXTS.column.completed}>
          {column.completed.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </BoardColumn.List>
      )}
      {!isClosed && children}
    </BoardColumn>
  );
}
