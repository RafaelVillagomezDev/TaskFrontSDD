import { Navigate, type RouteObject } from 'react-router';

import { LoginPage, RegisterPage } from '../../modules/auth';
import { BoardPage, HistoryPage } from '../../modules/tasks';
import { NAVIGATION_TEXTS } from '../texts/navigation.texts';
import { PlaceholderPage } from './placeholder.page';
import { PrivateLayout } from './private.layout';
import { ProtectedRoute } from './protected-route.component';
import { ROUTES } from './routes.constants';

// Rutas de la aplicación (plan §6.1). Las páginas son provisionales hasta que cada historia añade la suya
export const APP_ROUTES: RouteObject[] = [
  {
    element: <ProtectedRoute access="guest" />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <PrivateLayout />,
        children: [
          { path: ROUTES.board, element: <BoardPage /> },
          { path: ROUTES.history, element: <HistoryPage /> },
          { path: ROUTES.alerts, element: <PlaceholderPage>{NAVIGATION_TEXTS.alerts}</PlaceholderPage> },
          { path: ROUTES.account, element: <PlaceholderPage>{NAVIGATION_TEXTS.account}</PlaceholderPage> },
        ],
      },
    ],
  },
  // Cualquier otra ruta lleva al tablero (y, sin sesión, al inicio de sesión)
  { path: '*', element: <Navigate to={ROUTES.board} replace /> },
];
