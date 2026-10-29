import { LoaderCircle } from 'lucide-react';

import { COMMON_TEXTS } from '../texts/common.texts';
import { Icon } from './icon.component';

interface SpinnerProps {
  // Nombre accesible del estado de carga
  label?: string;
}

// Indicador de carga en la zona afectada, sin bloquear el resto de la pantalla (RF-40).
// <output> tiene el rol status de forma nativa (SonarQube S6819)
export function Spinner({ label = COMMON_TEXTS.loading }: Readonly<SpinnerProps>) {
  return (
    <output aria-label={label} className="inline-flex items-center text-foreground-muted">
      <Icon icon={LoaderCircle} className="animate-spin" />
    </output>
  );
}
