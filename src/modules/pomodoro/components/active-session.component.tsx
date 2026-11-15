import type { ReactNode } from 'react';

import { Text } from '@shared/ui/text.component';
import type { Pomodoro } from '../schemas/pomodoro.schema';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface ActiveSessionProps {
  session: Pomodoro;
  // Cuenta atrás, controles y lista de tareas (RF-15, RF-20, RF-23 a RF-25)
  children?: ReactNode;
}

const { session: texts } = POMODORO_TEXTS;

// Sesión activa en lugar del formulario (RF-05): su estado, el resumen «X de Y» (RF-21) y lo que se le pase
export function ActiveSession({ session, children }: Readonly<ActiveSessionProps>) {
  return (
    <section
      aria-label={texts.region}
      className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-4 md:p-6"
    >
      <div className="flex flex-col gap-1">
        <Text as="h2" variant="h3">
          {session.status === 'paused' ? texts.paused : texts.running}
        </Text>
        <Text variant="body-sm" tone="muted">
          {texts.summary(session.completedTasks, session.totalTasks)}
        </Text>
      </div>
      {children}
    </section>
  );
}
