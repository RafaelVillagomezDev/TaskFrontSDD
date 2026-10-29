import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { Button } from '../../../shared/ui/button.component';
import { Text } from '../../../shared/ui/text.component';

interface AuthSwitchProps {
  to: string;
  children: ReactNode;
}

interface AuthSwitchRootProps {
  children: ReactNode;
}

// Pie de los formularios de acceso: pregunta y enlace a la otra pantalla. El enlace mide 44 px de alto en
// móvil, como cualquier elemento interactivo (CONSTITUTION.md VII.4)
function AuthSwitchRoot({ children }: Readonly<AuthSwitchRootProps>) {
  return (
    <Text variant="body-sm" tone="muted" className="flex flex-wrap items-center justify-center gap-x-1">
      {children}
    </Text>
  );
}

function AuthSwitchLink({ to, children }: Readonly<AuthSwitchProps>) {
  return (
    <Button as={Link} to={to} variant="link" className="min-h-touch text-body-sm md:min-h-0">
      {children}
    </Button>
  );
}

export const AuthSwitch = Object.assign(AuthSwitchRoot, { Link: AuthSwitchLink });
