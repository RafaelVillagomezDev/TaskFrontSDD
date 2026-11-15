import type { ReactNode } from 'react';

import { Text } from '@shared/ui/text.component';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface SessionTaskListProps {
  // Cuántas tareas hay: sin ninguna se muestra el aviso en lugar de la lista
  count: number;
  // Una fila por tarea, en el orden de la API (RF-20)
  children: ReactNode;
}

const { session: texts } = POMODORO_TEXTS;

// Lista de tareas de una sesión con su nombre accesible; vacía, avisa de que no tiene tareas (API-004 RF-10)
export function SessionTaskList({ count, children }: Readonly<SessionTaskListProps>) {
  if (count === 0) {
    return (
      <Text variant="body-sm" tone="muted">
        {texts.noTasks}
      </Text>
    );
  }
  return (
    <ul aria-label={texts.tasks} className="flex flex-col divide-y divide-border">
      {children}
    </ul>
  );
}
