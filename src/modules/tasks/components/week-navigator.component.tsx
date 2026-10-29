import { ChevronLeft, ChevronRight } from 'lucide-react';

import { formatShortDate } from '../../../shared/date/date-format.util';
import { Button } from '../../../shared/ui/button.component';
import { Icon } from '../../../shared/ui/icon.component';
import { Text } from '../../../shared/ui/text.component';
import { TASKS_TEXTS } from '../texts/tasks.texts';

interface WeekNavigatorProps {
  weekStart: string;
  weekEnd: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

// Navegación del tablero de 7 en 7 días y vuelta a hoy (RF-12, RF-47, S-02)
export function WeekNavigator({ weekStart, weekEnd, onPrevious, onNext, onToday }: Readonly<WeekNavigatorProps>) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" aria-label={TASKS_TEXTS.week.previous} onClick={onPrevious}>
          <Icon icon={ChevronLeft} />
        </Button>
        <Button variant="secondary" size="sm" onClick={onToday}>
          {TASKS_TEXTS.week.today}
        </Button>
        <Button variant="secondary" size="sm" aria-label={TASKS_TEXTS.week.next} onClick={onNext}>
          <Icon icon={ChevronRight} />
        </Button>
      </div>
      {/* El rango se anuncia al cambiar de semana; cifras de ancho fijo para que los botones no se muevan */}
      <Text variant="body-sm" tone="muted" aria-live="polite" className="tabular-nums">
        {TASKS_TEXTS.week.range(formatShortDate(weekStart), formatShortDate(weekEnd))}
      </Text>
    </div>
  );
}
