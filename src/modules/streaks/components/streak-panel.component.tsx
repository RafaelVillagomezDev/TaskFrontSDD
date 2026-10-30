import type { ReactNode } from 'react';
import { CircleCheck, Flame, Plus, Trophy, type LucideIcon } from 'lucide-react';

import { cn } from '../../../shared/utils/class-names.util';
import { Badge } from '../../../shared/ui/badge.component';
import { Button } from '../../../shared/ui/button.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Icon } from '../../../shared/ui/icon.component';
import { Spinner } from '../../../shared/ui/spinner.component';
import { Text } from '../../../shared/ui/text.component';
import type { useStreakPanel } from '../hooks/use-streak-panel.hook';
import { STREAKS_TEXTS } from '../texts/streaks.texts';

type StreakPanelModel = ReturnType<typeof useStreakPanel>;

interface StreakPanelProps {
  panel: StreakPanelModel;
  // Abre el formulario de crear con la fecha de hoy, cuando hoy no tiene tareas (RF-28)
  onCreateTask: () => void;
}

interface StatProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}

// Un dato del panel (pareja dt/dd): icono neutro y etiqueta discreta, valor destacado (DESIGN.md: color solo
// para estados)
function Stat({ icon, label, children, className }: Readonly<StatProps>) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <dt className="flex items-center gap-2 text-caption text-foreground-muted">
        <Icon icon={icon} />
        {label}
      </dt>
      <dd className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

function StreakDays({ days }: Readonly<{ days: number | undefined }>) {
  return days === undefined ? <Spinner /> : STREAKS_TEXTS.panel.days(days);
}

function TodayProgressValue({ panel, onCreateTask }: Readonly<StreakPanelProps>) {
  if (panel.progress === undefined) return <Spinner />;
  if (!panel.hasNoTasksToday) return STREAKS_TEXTS.panel.progress(panel.progress.done, panel.progress.total);
  return (
    <>
      {STREAKS_TEXTS.panel.noTasksToday}
      <Button variant="secondary" size="sm" onClick={onCreateTask}>
        <Icon icon={Plus} />
        {STREAKS_TEXTS.panel.createTask}
      </Button>
    </>
  );
}

// Racha y progreso de hoy en la cabecera del tablero (S-10, RF-25 a RF-28). Plano como el resto del tablero:
// superficie y borde, sin sombra. Un fallo de la racha solo afecta a la racha, no al progreso (RF-44)
export function StreakPanel({ panel, onCreateTask }: Readonly<StreakPanelProps>) {
  return (
    <section
      aria-label={STREAKS_TEXTS.panel.region}
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4"
    >
      {panel.status === 'error' && <ErrorMessage message={panel.errorMessage ?? ''} onRetry={panel.retry} />}
      <dl className="grid grid-cols-2 gap-4 md:flex md:flex-wrap md:gap-x-12">
        {panel.status !== 'error' && (
          <>
            <Stat icon={Flame} label={STREAKS_TEXTS.panel.current}>
              <StreakDays days={panel.streak?.current} />
            </Stat>
            <Stat icon={Trophy} label={STREAKS_TEXTS.panel.best}>
              <StreakDays days={panel.streak?.best} />
            </Stat>
          </>
        )}
        <Stat icon={CircleCheck} label={STREAKS_TEXTS.panel.today} className="col-span-2">
          <TodayProgressValue panel={panel} onCreateTask={onCreateTask} />
        </Stat>
      </dl>
      {/* Aviso de estado (RF-27): <output> en vez de role="status" (S6819) */}
      {panel.atRisk && (
        <output className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge variant="warning">{STREAKS_TEXTS.panel.atRisk}</Badge>
          <Text as="span" variant="body-sm" tone="muted">
            {STREAKS_TEXTS.panel.atRiskDetail}
          </Text>
        </output>
      )}
    </section>
  );
}
