import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@shared/utils/class-names.util';
import { Icon } from '@shared/ui/icon.component';

interface StreakStatProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}

// Un dato de racha o progreso (pareja dt/dd dentro de un <dl>): icono neutro y etiqueta discreta, valor destacado
// (DESIGN.md: color solo para estados)
export function StreakStat({ icon, label, children, className }: Readonly<StreakStatProps>) {
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
