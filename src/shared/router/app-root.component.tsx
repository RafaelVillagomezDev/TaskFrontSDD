import { RouterProvider, type createBrowserRouter } from 'react-router';

import { useSessionBootstrap } from './use-session-bootstrap.hook';

interface AppRootProps {
  router: ReturnType<typeof createBrowserRouter>;
}

// Raíz de la aplicación: comprueba la sesión al arrancar y pinta las rutas
export function AppRoot({ router }: Readonly<AppRootProps>) {
  useSessionBootstrap();
  return <RouterProvider router={router} />;
}
