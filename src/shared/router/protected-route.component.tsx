import { Navigate, Outlet } from 'react-router';

import { NAVIGATION_TEXTS } from '../texts/navigation.texts';
import { Spinner } from '../ui/spinner.component';
import { useRouteAccess, type RouteAccess } from './use-route-access.hook';

interface ProtectedRouteProps {
  // private: solo con sesión (por defecto); guest: solo sin sesión (inicio de sesión y registro)
  access?: RouteAccess;
}

// Ruta protegida (RF-08): pinta sus rutas hijas, redirige o muestra el cargador mientras se comprueba la sesión
export function ProtectedRoute({ access = 'private' }: Readonly<ProtectedRouteProps>) {
  const decision = useRouteAccess(access);
  if (decision.kind === 'redirect') return <Navigate to={decision.to} replace />;
  if (decision.kind === 'allow') return <Outlet />;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-page">
      <Spinner label={NAVIGATION_TEXTS.checkingSession} />
    </div>
  );
}
