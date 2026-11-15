import { Menu, X } from 'lucide-react';
import { Outlet } from 'react-router';

import { LogoutButton } from '@modules/auth';
import { AppShell } from '@shared/layout/app-shell.layout';
import { MainNavigation } from '@shared/layout/main-navigation.component';
import { Navbar } from '@shared/layout/navbar.component';
import { Sidebar } from '@shared/layout/sidebar.component';
import { useNavigationDrawer } from '@shared/layout/use-navigation-drawer.hook';
import { NAVIGATION_TEXTS } from '@shared/texts/navigation.texts';
import { Drawer } from '@shared/ui/drawer.component';
import { Icon } from '@shared/ui/icon.component';
import { Text } from '@shared/ui/text.component';

// Shell de las pantallas privadas (plan §6.2): Sidebar desde lg; por debajo, Navbar con el menú en un Drawer
export function PrivateLayout() {
  const drawer = useNavigationDrawer();
  return (
    <AppShell>
      <Sidebar>
        <Text as="p" variant="h4" tone="primary" className="px-4">
          {NAVIGATION_TEXTS.appName}
        </Text>
        <MainNavigation>
          <LogoutButton />
        </MainNavigation>
      </Sidebar>
      <AppShell.Body>
        <Navbar>
          <div className="lg:hidden">
            <Drawer open={drawer.open} onOpenChange={drawer.onOpenChange}>
              <Drawer.Trigger variant="ghost" aria-label={NAVIGATION_TEXTS.openMenu}>
                <Icon icon={Menu} />
              </Drawer.Trigger>
              <Drawer.Content>
                <div className="flex items-center justify-between gap-2">
                  <Drawer.Title>{NAVIGATION_TEXTS.menu}</Drawer.Title>
                  <Drawer.Close variant="ghost" aria-label={NAVIGATION_TEXTS.closeMenu}>
                    <Icon icon={X} />
                  </Drawer.Close>
                </div>
                <MainNavigation>
                  <LogoutButton />
                </MainNavigation>
              </Drawer.Content>
            </Drawer>
          </div>
          <Text as="p" variant="h4" tone="primary" className="lg:hidden">
            {NAVIGATION_TEXTS.appName}
          </Text>
        </Navbar>
        <Outlet />
      </AppShell.Body>
    </AppShell>
  );
}
