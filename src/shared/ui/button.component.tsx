import type { ElementType } from 'react';

import { cn } from '../utils/class-names.util';
import type { PolymorphicProps } from './polymorphic.types';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export type ButtonProps<E extends ElementType = 'button'> = PolymorphicProps<E, ButtonOwnProps>;

// Variantes de DESIGN.md (Buttons): hover 10 % y active 20 % más oscuros, disabled al 40 %
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active',
  secondary: 'border border-primary bg-transparent text-primary-text hover:bg-surface-subtle',
  ghost: 'bg-transparent text-foreground hover:bg-surface-subtle',
  destructive: 'bg-destructive text-on-destructive hover:bg-destructive-hover active:bg-destructive-active',
  link: 'bg-transparent text-primary-text underline-offset-4 hover:underline',
};

// Alturas de DESIGN.md desde md; en móvil el mínimo táctil de 44 px manda (CONSTITUTION.md VII.4)
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-body-sm md:h-control-sm',
  md: 'px-4 py-btn-md-y text-button-md md:h-control-md',
  lg: 'px-6 py-3 text-body md:h-control-lg',
};

const TOUCH_TARGET = 'min-h-touch min-w-touch md:min-h-0 md:min-w-0';

// Respuesta al pulsar (DESIGN.md Motion): encoge un 3 % para confirmar que la interfaz recibió el toque.
// Sin movimiento si el sistema pide reducirlo; los enlaces de texto no encogen
const PRESS_FEEDBACK = 'active:scale-97 motion-reduce:active:scale-100';

export function Button<E extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  type,
  className,
  ...rest
}: ButtonProps<E>) {
  const Component: ElementType = as ?? 'button';
  const isLink = variant === 'link';

  return (
    <Component
      {...rest}
      type={Component === 'button' ? (type ?? 'button') : type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'focus-ring anim-fast transition disabled:pointer-events-none disabled:opacity-40',
        VARIANT_CLASSES[variant],
        !isLink && SIZE_CLASSES[size],
        !isLink && TOUCH_TARGET,
        !isLink && PRESS_FEEDBACK,
        className,
      )}
    />
  );
}
