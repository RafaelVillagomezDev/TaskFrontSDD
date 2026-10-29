import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';

import { cn } from '../utils/class-names.util';
import { Icon } from '../ui/icon.component';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  children: ReactNode;
}

// Ítem de navegación de DESIGN.md: icono de 20 px + etiqueta Body SM 500, padding 12 px 16 px. El activo lleva
// borde izquierdo de 3 px en Nova Blue y fondo azul claro; NavLink le pone aria-current="page" (RF-54)
export function NavItem({ to, icon, children }: Readonly<NavItemProps>) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'focus-ring anim-fast flex min-h-touch items-center gap-3 rounded-md border-l-3 px-4 py-3 text-body-sm font-medium transition-colors',
          isActive
            ? 'border-primary bg-nav-active text-primary-text'
            : 'border-transparent text-foreground-muted hover:bg-surface-subtle hover:text-foreground',
        )
      }
    >
      <Icon icon={icon} />
      {children}
    </NavLink>
  );
}
