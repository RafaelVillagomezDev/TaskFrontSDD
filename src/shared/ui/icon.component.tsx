import type { LucideIcon } from 'lucide-react';

import { ICON_SIZES, ICON_STROKE_WIDTH } from './icon.constants';

export type IconSize = keyof typeof ICON_SIZES;

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  // Nombre accesible: sin él, el icono es decorativo y se oculta a los lectores de pantalla (VII.4)
  label?: string;
  className?: string;
}

// Único acceso a Lucide (CONSTITUTION.md VII.2): tamaño y grosor de DESIGN.md, color heredado del texto
export function Icon({ icon: LucideComponent, size = 'inline', label, className }: IconProps) {
  const accessibility = label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label };
  return (
    <LucideComponent
      size={ICON_SIZES[size]}
      strokeWidth={ICON_STROKE_WIDTH}
      color="currentColor"
      className={className}
      {...accessibility}
    />
  );
}
