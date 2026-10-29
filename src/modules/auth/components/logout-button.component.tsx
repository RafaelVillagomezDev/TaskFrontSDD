import { LogOut } from 'lucide-react';

import { Button } from '../../../shared/ui/button.component';
import { Icon } from '../../../shared/ui/icon.component';
import { useLogout } from '../hooks/use-logout.hook';
import { AUTH_TEXTS } from '../texts/auth.texts';

// Cerrar sesión desde la navegación (RF-50)
export function LogoutButton() {
  const { logout, isLoggingOut } = useLogout();
  return (
    <Button variant="ghost" onClick={logout} disabled={isLoggingOut} className="w-full justify-start px-4">
      <Icon icon={LogOut} />
      {AUTH_TEXTS.logout}
    </Button>
  );
}
