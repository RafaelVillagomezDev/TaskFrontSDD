import type { ComponentPropsWithRef } from 'react';
import { Check } from 'lucide-react';

import { cn } from '../utils/class-names.util';
import { Icon } from './icon.component';

type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type'>;

// Casilla nativa (teclado, formularios y lectores de pantalla de serie) con el objetivo táctil de 44×44 px en
// móvil (CONSTITUTION.md VII.4): el <input> ocupa toda la zona y es transparente; encima se pinta la casilla de
// 24 px (icon-lg) con el icono de 20 px y los tokens de DESIGN.md. El foco se ve en la casilla pintada, no en la
// zona transparente. La etiqueta la pone quien la usa (un <label> que la envuelve)
export function Checkbox({ className, ...rest }: Readonly<CheckboxProps>) {
  return (
    <span className={cn('relative grid size-touch shrink-0 place-items-center md:size-icon-lg', className)}>
      <input
        {...rest}
        type="checkbox"
        className="peer absolute inset-0 size-full cursor-pointer appearance-none outline-none"
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none grid size-icon-lg place-items-center rounded-sm border border-border-input bg-surface',
          'text-transparent anim-fast transition',
          'peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
          'peer-aria-disabled:opacity-40',
        )}
      >
        <Icon icon={Check} />
      </span>
    </span>
  );
}
