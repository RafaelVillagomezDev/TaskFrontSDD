import { Navigate, type RouteObject } from 'react-router';

import { AccountPage } from '@modules/account';
import { AlertsPage } from '@modules/alerts';
import { LoginPage, RegisterPage } from '@modules/auth';
import {
  PomodoroAchievementsPage,
  PomodoroHistoryPage,
  PomodoroLayout,
  PomodoroSessionDetailPage,
  PomodoroSessionPage,
} from '@modules/pomodoro';
import { BoardPage, HistoryPage, TaskDayPage } from '@modules/tasks';
import { PrivateLayout } from './private.layout';
import { ProtectedRoute } from './protected-route.component';
import { ROUTES } from './routes.constants';

// Rutas de la aplicación (plan §6.1)
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
          { path: ROUTES.taskDay, element: <TaskDayPage /> },
          // Sección del pomodoro (003 RF-51): sus vistas cuelgan de este layout
          {
            element: <PomodoroLayout />,
            children: [
              { path: ROUTES.pomodoro, element: <PomodoroSessionPage /> },
              { path: ROUTES.pomodoroHistory, element: <PomodoroHistoryPage /> },
              { path: `${ROUTES.pomodoroHistory}/:id`, element: <PomodoroSessionDetailPage /> },
              { path: ROUTES.pomodoroAchievements, element: <PomodoroAchievementsPage /> },
            ],
          },
          { path: ROUTES.history, element: <HistoryPage /> },
          { path: ROUTES.alerts, element: <AlertsPage /> },
          { path: ROUTES.account, element: <AccountPage /> },
        ],
      },
    ],
  },
  // Cualquier otra ruta lleva al tablero (y, sin sesión, al inicio de sesión)
  { path: '*', element: <Navigate to={ROUTES.board} replace /> },
];
