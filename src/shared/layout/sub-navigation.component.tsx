import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

import { cn } from '@shared/utils/class-names.util';

interface SubNavigationProps {
  'aria-label': string;
  children: ReactNode;
}

interface SubNavigationLinkProps {
  to: string;
  children: ReactNode;
  // También activo en las subrutas («Historial» en /pomodoro/history/:id); por defecto, solo en la ruta exacta
  matchSubroutes?: boolean;
}

// Subnavegación de una sección con varias vistas, cada una con su ruta (003 RF-51, plan D-7). Son enlaces y no
// role="tablist": cada vista tiene su URL. Si no caben, se desplazan en horizontal dentro de la propia fila
function SubNavigationRoot({ 'aria-label': ariaLabel, children }: Readonly<SubNavigationProps>) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="flex gap-6 overflow-x-auto border-b border-border">{children}</ul>
    </nav>
  );
}

// Pestaña de vista de DESIGN.md («View tabs»): Body SM 500; inactiva en texto atenuado y activa en Tide con un
// borde inferior de 2 px. NavLink le pone aria-current="page"
function SubNavigationLink({ to, children, matchSubroutes = false }: Readonly<SubNavigationLinkProps>) {
  return (
    <li className="shrink-0">
      <NavLink
        to={to}
        end={!matchSubroutes}
        className={({ isActive }) =>
          cn(
            'focus-ring anim-fast -mb-px flex min-h-touch items-center border-b-2 text-body-sm font-medium whitespace-nowrap transition-colors',
            isActive
              ? 'border-primary text-primary-text'
              : 'border-transparent text-foreground-muted hover:text-foreground',
          )
        }
      >
        {children}
      </NavLink>
    </li>
  );
}

export const SubNavigation = Object.assign(SubNavigationRoot, { Link: SubNavigationLink });
