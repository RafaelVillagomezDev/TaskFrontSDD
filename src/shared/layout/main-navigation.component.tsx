import type { ReactNode } from 'react';
import { Bell, CircleCheckBig, LayoutDashboard, ListChecks, Timer, UserRound } from 'lucide-react';

import { ROUTES } from '@shared/router/routes.constants';
import { NAVIGATION_TEXTS } from '@shared/texts/navigation.texts';
import { Text } from '@shared/ui/text.component';
import { NavItem } from './nav-item.component';
import { useMainNavigation } from './use-main-navigation.hook';

interface MainNavigationProps {
  // Acciones de la sesión bajo la navegación (cerrar sesión, T055)
  children?: ReactNode;
}

// Navegación de las pantallas privadas (RF-50, 002 RF-08 y 003 RF-02): usuario arriba, las seis secciones y las acciones de sesión.
// La misma pieza va en el Sidebar (lg) y en el Drawer (móvil y tablet)
export function MainNavigation({ children }: Readonly<MainNavigationProps>) {
  const { displayName } = useMainNavigation();
  return (
    <div className="flex flex-1 flex-col gap-6">
      {displayName !== null && (
        // Un email largo se recorta: el texto completo, al pasar el ratón
        <Text variant="body-sm" title={displayName} className="truncate px-4 font-semibold">
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
            <NavItem to={ROUTES.taskDay} icon={CircleCheckBig}>
              {NAVIGATION_TEXTS.taskDay}
            </NavItem>
          </li>
          <li>
            <NavItem to={ROUTES.pomodoro} icon={Timer} matchSubroutes>
              {NAVIGATION_TEXTS.pomodoro}
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
