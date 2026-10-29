import { CircleAlert } from 'lucide-react';

import { COMMON_TEXTS } from '../texts/common.texts';
import { Box } from './box.component';
import { Button } from './button.component';
import { Icon } from './icon.component';
import { Text } from './text.component';

interface ErrorMessageProps {
  // Mensaje ya traducido (errorMessage de api-error.util), nunca el código técnico (RF-41)
  message: string;
  onRetry?: () => void;
}

// Error de una zona con la opción de reintentar (RF-44)
export function ErrorMessage({ message, onRetry }: Readonly<ErrorMessageProps>) {
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
    </Box>
  );
}
