import { Navigate, type RouteObject } from 'react-router';

import { AuthLayout } from '../layout/auth-layout.layout';
import { GUEST_PAGE_TEXTS, NAVIGATION_TEXTS } from '../texts/navigation.texts';
import { Text } from '../ui/text.component';
import { PlaceholderPage } from './placeholder.page';
import { PrivateLayout } from './private.layout';
import { ProtectedRoute } from './protected-route.component';
import { ROUTES } from './routes.constants';

// Rutas de la aplicación (plan §6.1). Las páginas son provisionales hasta que cada historia añade la suya
export const APP_ROUTES: RouteObject[] = [
  {
    element: <ProtectedRoute access="guest" />,
    children: [
      {
        path: ROUTES.login,
        element: (
          <AuthLayout>
            <Text as="h1" variant="h3">
              {GUEST_PAGE_TEXTS.login}
            </Text>
          </AuthLayout>
        ),
      },
      {
        path: ROUTES.register,
        element: (
          <AuthLayout>
            <Text as="h1" variant="h3">
              {GUEST_PAGE_TEXTS.register}
            </Text>
          </AuthLayout>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PrivateLayout />,
        children: [
          { path: ROUTES.board, element: <PlaceholderPage>{NAVIGATION_TEXTS.board}</PlaceholderPage> },
          { path: ROUTES.history, element: <PlaceholderPage>{NAVIGATION_TEXTS.history}</PlaceholderPage> },
          { path: ROUTES.alerts, element: <PlaceholderPage>{NAVIGATION_TEXTS.alerts}</PlaceholderPage> },
          { path: ROUTES.account, element: <PlaceholderPage>{NAVIGATION_TEXTS.account}</PlaceholderPage> },
        ],
      },
    ],
  },
  // Cualquier otra ruta lleva al tablero (y, sin sesión, al inicio de sesión)
  { path: '*', element: <Navigate to={ROUTES.board} replace /> },
];
