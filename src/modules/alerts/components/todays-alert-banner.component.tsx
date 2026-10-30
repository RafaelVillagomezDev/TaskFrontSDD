import { Bell } from 'lucide-react';
import { Link } from 'react-router';

import { ROUTES } from '../../../shared/router/routes.constants';
import { Button } from '../../../shared/ui/button.component';
import { Icon } from '../../../shared/ui/icon.component';
import type { Alert } from '../schemas/alert.schema';
import { ALERTS_TEXTS } from '../texts/alerts.texts';

interface TodaysAlertBannerProps {
  alert: Alert;
}

const { banner: texts } = ALERTS_TEXTS;

// Aviso de hoy destacado en el tablero (RF-37): tipo, número de tareas y acceso al detalle en /alerts, donde es el
// primero. Tinte Warning del sistema de badges, el único color de estado que encaja con un aviso (DESIGN.md)
export function TodaysAlertBanner({ alert }: Readonly<TodaysAlertBannerProps>) {
  return (
    <section
      aria-label={texts.region}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-lg bg-badge-warning-bg p-4 text-badge-warning-fg"
    >
      <Icon icon={Bell} />
      {/* Texto en el color del tinte (pareja de contraste comprobada en design-tokens.contrast.test.ts) */}
      <div className="flex min-w-0 flex-1 flex-col text-body-sm">
        <p className="font-semibold">{texts.title(ALERTS_TEXTS.type[alert.type])}</p>
        <p>{texts.tasks(alert.tasks.length)}</p>
      </div>
      <Button as={Link} to={ROUTES.alerts} variant="secondary" size="sm">
        {texts.open}
      </Button>
    </section>
  );
}
