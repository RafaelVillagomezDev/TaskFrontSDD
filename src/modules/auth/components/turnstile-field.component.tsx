import type { ReactNode } from 'react';

import { Text } from '@shared/ui/text.component';

interface TurnstileFieldProps {
  // Contenedor donde Cloudflare pinta el widget (useTurnstile)
  containerRef: (element: HTMLElement | null) => void;
  errorText?: string | undefined;
  // Estado de la comprobación para lectores de pantalla
  children: ReactNode;
}

// Sitio del widget de Turnstile en un formulario (spec 005 RF-01, RNF-01, RNF-02; plan, sección 5): ancho del
// formulario y alto reservado para que el botón no salte al aparecer; el mensaje va debajo, como el de un campo
export function TurnstileField({ containerRef, errorText, children }: Readonly<TurnstileFieldProps>) {
  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="min-h-16 w-full" />
      <p className="sr-only" aria-live="polite">
        {children}
      </p>
      {errorText !== undefined && (
        <Text variant="body-sm" tone="danger" role="alert">
          {errorText}
        </Text>
      )}
    </div>
  );
}
