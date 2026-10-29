import { LoaderCircle } from 'lucide-react';

import { COMMON_TEXTS } from '../texts/common.texts';
import { Icon } from './icon.component';

interface SpinnerProps {
  // Nombre accesible del estado de carga
  label?: string;
}

// Indicador de carga en la zona afectada, sin bloquear el resto de la pantalla (RF-40)
export function Spinner({ label = COMMON_TEXTS.loading }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className="inline-flex items-center text-foreground-muted">
      <Icon icon={LoaderCircle} className="animate-spin" />
    </div>
  );
}
