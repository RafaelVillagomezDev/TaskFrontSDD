import type { ReactNode } from 'react';

import { cn } from '../utils/class-names.util';

// Variantes de DESIGN.md (Badges / Tags); outline es la etiqueta de identificador del tablero (Layout Patterns)
export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-badge-default-bg text-badge-default-fg',
  primary: 'bg-badge-primary-bg text-badge-primary-fg',
  success: 'bg-badge-success-bg text-badge-success-fg',
  warning: 'bg-badge-warning-bg text-badge-warning-fg',
  danger: 'bg-badge-danger-bg text-badge-danger-fg',
  outline: 'border border-border bg-transparent text-foreground-muted',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={cn('inline-flex h-pill items-center rounded-full px-2 text-caption', VARIANT_CLASSES[variant])}>
      {children}
    </span>
  );
}
