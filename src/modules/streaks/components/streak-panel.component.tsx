import { CircleCheck, Plus } from 'lucide-react';

import { Badge } from '@shared/ui/badge.component';
import { Button } from '@shared/ui/button.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Icon } from '@shared/ui/icon.component';
import { Spinner } from '@shared/ui/spinner.component';
import { Text } from '@shared/ui/text.component';
import type { useStreakPanel } from '../hooks/use-streak-panel.hook';
import { STREAKS_TEXTS } from '../texts/streaks.texts';
import { StreakStat } from './streak-stat.component';
import { StreakStats } from './streak-stats.component';

type StreakPanelModel = ReturnType<typeof useStreakPanel>;

interface StreakPanelProps {
  panel: StreakPanelModel;
  // Abre el formulario de crear con la fecha de hoy, cuando hoy no tiene tareas (RF-28)
  onCreateTask: () => void;
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
          <StreakStats streak={panel.streak} />
        )}
        <StreakStat icon={CircleCheck} label={STREAKS_TEXTS.panel.today} className="col-span-2">
          <TodayProgressValue panel={panel} onCreateTask={onCreateTask} />
        </StreakStat>
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
