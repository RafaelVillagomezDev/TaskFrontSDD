import type { ReactNode } from 'react';

import { Button } from '@shared/ui/button.component';
import { Spinner } from '@shared/ui/spinner.component';
import { Text } from '@shared/ui/text.component';
import type { Pomodoro, PomodoroTask } from '../schemas/pomodoro.schema';
import { focusDuration, POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface SessionResultProps {
  // Sesión terminada; undefined mientras se carga tras una recarga
  session: Pomodoro | undefined;
  onStartAnother: () => void;
  // Aviso de logros nuevos (RF-68), en la Fase 2
  children?: ReactNode;
}

interface ResultTasksProps {
  // Nombre accesible de la lista; el encabezado visible y sus notas van en children
  name: string;
  tasks: PomodoroTask[];
  children: ReactNode;
}

const { result: texts, session: sessionTexts } = POMODORO_TEXTS;

function ResultTasks({ name, tasks, children }: Readonly<ResultTasksProps>) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {children}
      <ul aria-label={name} className="flex flex-col gap-1">
        {tasks.map((task) => (
          <li key={task.id}>
            <Text variant="body-sm" className="break-words">
              {task.title}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Resultado de una sesión terminada (RF-27, RF-28, RF-71): «X de Y», concentración, motivo de fin, tareas
// completadas y pendientes (que han pasado a espera) y «Empezar otra sesión»
export function SessionResult({ session, onStartAnother, children }: Readonly<SessionResultProps>) {
  return (
    <section
      aria-label={texts.region}
      className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-4 md:p-6"
    >
      {session === undefined ? (
        <Spinner label={texts.loading} />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <Text as="h2" variant="h3">
              {texts.title}
            </Text>
            <Text variant="body-sm" tone="muted">
              {session.endReason === 'manual' ? texts.manual : texts.byTime}
              {' · '}
              {texts.focus(focusDuration(session.focusedSeconds ?? 0))}
            </Text>
            <Text variant="body" className="font-semibold">
              {sessionTexts.summary(session.completedTasks, session.totalTasks)}
            </Text>
          </div>
          {children}
          <ResultTasks name={texts.completed} tasks={session.tasks.filter((task) => task.completed)}>
            <Text as="h3" variant="body" className="font-semibold">
              {texts.completed}
            </Text>
          </ResultTasks>
          <ResultTasks name={texts.pending} tasks={session.tasks.filter((task) => !task.completed)}>
            <Text as="h3" variant="body" className="font-semibold">
              {texts.pending}
            </Text>
            <Text variant="body-sm" tone="muted">
              {texts.pendingMoved}
            </Text>
          </ResultTasks>
        </>
      )}
      <Button onClick={onStartAnother} className="w-full sm:w-auto sm:self-start">
        {texts.startAnother}
      </Button>
    </section>
  );
}
