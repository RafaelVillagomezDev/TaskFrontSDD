import type { ElementType } from 'react';

import { cn } from '../utils/class-names.util';
import type { PolymorphicProps } from './polymorphic.types';

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'body-sm' | 'caption';
export type TextTone = 'default' | 'muted' | 'primary' | 'danger';

interface TextOwnProps {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
}

export type TextProps<E extends ElementType = 'p'> = PolymorphicProps<E, TextOwnProps>;

// Escala tipográfica de DESIGN.md; clases literales para que Tailwind las detecte
const VARIANT_CLASSES: Record<TextVariant, string> = {
  display: 'text-display',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  'body-lg': 'text-body-lg',
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
};

// Elemento semántico por defecto de cada variante; `as` lo cambia sin cambiar el estilo
const DEFAULT_ELEMENT: Record<TextVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'body-lg': 'p',
  body: 'p',
  'body-sm': 'p',
  caption: 'span',
};

const TONE_CLASSES: Record<TextTone, string> = {
  default: 'text-foreground',
  muted: 'text-foreground-muted',
  primary: 'text-primary-text',
  danger: 'text-danger-text',
};

export function Text<E extends ElementType = 'p'>({
  as,
  variant = 'body',
  tone = 'default',
  className,
  ...rest
}: TextProps<E>) {
  const Component: ElementType = as ?? DEFAULT_ELEMENT[variant];
  return <Component {...rest} className={cn(VARIANT_CLASSES[variant], TONE_CLASSES[tone], className)} />;
}
