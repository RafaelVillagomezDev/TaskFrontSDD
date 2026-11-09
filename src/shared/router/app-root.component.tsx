import { RouterProvider, type createBrowserRouter } from 'react-router';

import { useSessionSync } from '@shared/session/use-session-sync.hook';
import { useSessionBootstrap } from './use-session-bootstrap.hook';

interface AppRootProps {
  router: ReturnType<typeof createBrowserRouter>;
}

// Raíz de la aplicación: comprueba la sesión al arrancar, escucha el fin de la sesión en otras pestañas (spec 004
// RF-04, RF-05) y pinta las rutas
export function AppRoot({ router }: Readonly<AppRootProps>) {
  useSessionBootstrap();
  useSessionSync();
  return <RouterProvider router={router} />;
}
