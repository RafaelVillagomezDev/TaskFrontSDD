import type { ReactNode } from 'react';

import { Checkbox } from '@shared/ui/checkbox.component';
import { Text } from '@shared/ui/text.component';
import { cn } from '@shared/utils/class-names.util';
import type { PomodoroTask } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface SessionTaskItemProps {
  task: PomodoroTask;
  // Mientras se guarda su cambio, la casilla no se puede volver a pulsar (plan D-2)
  saving: boolean;
  onToggle: (task: PomodoroTask) => void;
  // Acciones de la fila: editar y quitar (RF-30, RF-35)
  children?: ReactNode;
}

const { session: texts } = POMODORO_TEXTS;

// Tarea de la sesión activa (RF-20, RF-22): casilla para completarla o desmarcarla, título y descripción. Completada,
// se tacha y se atenúa; un título largo sin espacios se parte en lugar de desbordar
export function SessionTaskItem({ task, saving, onToggle, children }: Readonly<SessionTaskItemProps>) {
  return (
    <li className="flex items-start gap-3 py-3">
      <Checkbox
        checked={task.completed}
        aria-label={texts.complete(task.title)}
        aria-disabled={saving}
        onChange={() => {
          if (!saving) onToggle(task);
        }}
      />
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1 pt-2 md:pt-0', task.completed && 'text-foreground-muted')}>
        <Text variant="body" className={cn('break-words', task.completed && 'line-through')}>
          {task.title}
        </Text>
        {task.description !== null && (
          <Text variant="body-sm" tone="muted" className="break-words">
            {task.description}
          </Text>
        )}
      </div>
      {children}
    </li>
  );
}
