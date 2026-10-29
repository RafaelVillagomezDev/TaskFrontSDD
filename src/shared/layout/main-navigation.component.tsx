import type { ReactNode } from 'react';
import { Bell, LayoutDashboard, ListChecks, UserRound } from 'lucide-react';

import { ROUTES } from '../router/routes.constants';
import { NAVIGATION_TEXTS } from '../texts/navigation.texts';
import { Text } from '../ui/text.component';
import { NavItem } from './nav-item.component';
import { useMainNavigation } from './use-main-navigation.hook';

interface MainNavigationProps {
  // Acciones de la sesión bajo la navegación (cerrar sesión, T055)
  children?: ReactNode;
}

// Navegación de las pantallas privadas (RF-50): usuario arriba, las cuatro pantallas y las acciones de sesión.
// La misma pieza va en el Sidebar (lg) y en el Drawer (móvil y tablet)
export function MainNavigation({ children }: Readonly<MainNavigationProps>) {
  const { displayName } = useMainNavigation();
  return (
    <div className="flex flex-1 flex-col gap-6">
      {displayName !== null && (
        <Text variant="body-sm" className="truncate px-4 font-semibold">
          {displayName}
        </Text>
      )}
      <nav aria-label={NAVIGATION_TEXTS.mainNavigation}>
        <ul className="flex flex-col gap-1">
          <li>
            <NavItem to={ROUTES.board} icon={LayoutDashboard}>
              {NAVIGATION_TEXTS.board}
            </NavItem>
          </li>
          <li>
            <NavItem to={ROUTES.history} icon={ListChecks}>
              {NAVIGATION_TEXTS.history}
            </NavItem>
          </li>
          <li>
            <NavItem to={ROUTES.alerts} icon={Bell}>
              {NAVIGATION_TEXTS.alerts}
            </NavItem>
          </li>
          <li>
            <NavItem to={ROUTES.account} icon={UserRound}>
              {NAVIGATION_TEXTS.account}
            </NavItem>
          </li>
        </ul>
      </nav>
      {children !== undefined && <div className="mt-auto flex flex-col gap-2">{children}</div>}
    </div>
  );
}
