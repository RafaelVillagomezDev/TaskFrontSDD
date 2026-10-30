import { CircleAlert, X } from 'lucide-react';

import { COMMON_TEXTS } from '../texts/common.texts';
import { Box } from './box.component';
import { Button } from './button.component';
import { Icon } from './icon.component';
import { Text } from './text.component';

interface ErrorMessageProps {
  // Mensaje ya traducido (errorMessage de api-error.util), nunca el código técnico (RF-41)
  message: string;
  onRetry?: (() => void) | undefined;
  // Con onDismiss el error se puede cerrar, como Notice
  onDismiss?: (() => void) | undefined;
}

// Error de una zona con la opción de reintentar (RF-44) y, si se puede, de cerrarlo
export function ErrorMessage({ message, onRetry, onDismiss }: Readonly<ErrorMessageProps>) {
  return (
    <Box variant="subtle" role="alert" className="flex flex-wrap items-center gap-3 p-4">
      <span className="text-danger">
        <Icon icon={CircleAlert} />
      </span>
      <Text variant="body-sm" className="flex-1">
        {message}
      </Text>
      {onRetry !== undefined && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {COMMON_TEXTS.retry}
        </Button>
      )}
      {onDismiss !== undefined && (
        <Button variant="ghost" size="sm" aria-label={COMMON_TEXTS.dismissNotice} onClick={onDismiss}>
          <Icon icon={X} />
        </Button>
      )}
    </Box>
  );
}
