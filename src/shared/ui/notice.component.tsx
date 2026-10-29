import type { ReactNode } from 'react';
import { X } from 'lucide-react';

import { COMMON_TEXTS } from '../texts/common.texts';
import { Box } from './box.component';
import { Button } from './button.component';
import { Icon } from './icon.component';

interface NoticeProps {
  children: ReactNode;
  // Con onDismiss el aviso muestra un botón para cerrarlo; sin él, se queda hasta que la pantalla lo quite
  onDismiss?: () => void;
}

// Aviso informativo de una zona (cuenta creada, sesión caducada, tarea creada fuera de la semana);
// el texto va en un <output>, que lo anuncia como estado (SonarQube S6819), y el botón queda fuera de él
export function Notice({ children, onDismiss }: Readonly<NoticeProps>) {
  return (
    <Box variant="subtle" className="flex items-center gap-3 p-4">
      <output className="block flex-1 text-body-sm">{children}</output>
      {onDismiss !== undefined && (
        <Button variant="ghost" size="sm" aria-label={COMMON_TEXTS.dismissNotice} onClick={onDismiss}>
          <Icon icon={X} />
        </Button>
      )}
    </Box>
  );
}
