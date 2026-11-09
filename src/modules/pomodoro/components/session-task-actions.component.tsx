import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import { Button } from '@shared/ui/button.component';
import { Icon } from '@shared/ui/icon.component';
import type { PomodoroTask } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface SessionTaskActionsProps {
  task: PomodoroTask;
  onRemove: (task: PomodoroTask) => void;
  // Otras acciones de la fila, como editar (RF-35)
  children?: ReactNode;
}

const { add: texts } = POMODORO_TEXTS;

// Acciones de una tarea de la sesión activa: «Quitar» solo mientras está pendiente (RF-30, RF-31); una completada
// hay que desmarcarla antes (API-004 RF-37)
export function SessionTaskActions({ task, onRemove, children }: Readonly<SessionTaskActionsProps>) {
  return (
    <div className="flex shrink-0 items-center">
      {children}
      {!task.completed && (
        <Button
          variant="ghost"
          size="sm"
          aria-label={texts.remove(task.title)}
          onClick={() => {
            onRemove(task);
          }}
        >
          <Icon icon={X} />
        </Button>
      )}
    </div>
  );
}
