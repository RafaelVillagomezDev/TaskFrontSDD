import type { ReactNode } from 'react';

import { cn } from '../utils/class-names.util';
import { Text } from './text.component';
import type { FieldIds } from './use-field-ids.hook';

// Tono de la ayuda: danger cuando la propia ayuda avisa de un problema (un contador por encima del máximo)
export type HelperTone = 'muted' | 'danger';

interface FieldProps {
  ids: FieldIds;
  label: string;
  helperText?: string | undefined;
  helperTone?: HelperTone | undefined;
  errorText?: string | undefined;
  children: ReactNode;
}

// Estilo común de los controles según DESIGN.md (Inputs): borde Gray 300, foco de 2 px en primary,
// borde de peligro con error; en móvil, al menos 44 px de alto (CONSTITUTION.md VII.4)
// Un textarea crece con su contenido; un select centra su texto en la altura fija, sin padding vertical que
// lo recorte
export type ControlKind = 'input' | 'textarea' | 'select';

export function controlClassName(hasError: boolean, kind: ControlKind = 'input'): string {
  return cn(
    'w-full rounded-md border bg-surface px-4 text-body text-foreground anim-fast transition-colors',
    'focus:outline-2 focus:-outline-offset-1 focus:outline-primary disabled:opacity-40',
    'min-h-touch',
    kind !== 'select' && 'py-3',
    kind !== 'textarea' && 'md:h-control-md md:min-h-0',
    hasError ? 'border-danger' : 'border-border-input',
  );
}

// Etiqueta, control, ayuda y error bajo el campo (spec RF-02)
export function Field({ ids, label, helperText, helperTone = 'muted', errorText, children }: Readonly<FieldProps>) {
  return (
    <div className="flex flex-col gap-2">
      <Text as="label" htmlFor={ids.controlId} variant="body-sm" className="font-medium">
        {label}
      </Text>
      {children}
      {helperText !== undefined && (
        <Text id={ids.helperId} variant="body-sm" tone={helperTone}>
          {helperText}
        </Text>
      )}
      {errorText !== undefined && (
        <Text id={ids.errorId} variant="body-sm" tone="danger">
          {errorText}
        </Text>
      )}
    </div>
  );
}
