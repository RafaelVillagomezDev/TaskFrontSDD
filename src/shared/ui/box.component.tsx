import type { ElementType } from 'react';

import { cn } from '../utils/class-names.util';
import type { PolymorphicProps } from './polymorphic.types';

export type BoxVariant = 'plain' | 'surface' | 'subtle' | 'card';

interface BoxOwnProps {
  variant?: BoxVariant;
  className?: string;
}

export type BoxProps<E extends ElementType = 'div'> = PolymorphicProps<E, BoxOwnProps>;

// card según DESIGN.md (Cards): superficie, borde, radius-lg, space-6 y shadow-md
const VARIANT_CLASSES: Record<BoxVariant, string> = {
  plain: '',
  surface: 'bg-surface',
  subtle: 'rounded-md bg-surface-subtle',
  card: 'rounded-lg border border-border bg-surface p-6 shadow-md',
};

export function Box<E extends ElementType = 'div'>({ as, variant = 'plain', className, ...rest }: BoxProps<E>) {
  const Component: ElementType = as ?? 'div';
  return <Component {...rest} className={cn(VARIANT_CLASSES[variant], className) || undefined} />;
}
