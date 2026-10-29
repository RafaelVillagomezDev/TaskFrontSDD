import { useLocation, useSearchParams } from 'react-router';

import { selectAuthStatus, selectSessionExpired } from '../../modules/auth';
import { useAppSelector } from '../store/hooks';
import { REASON_EXPIRED, REASON_PARAM, RETURN_TO_PARAM, ROUTES } from './routes.constants';

export type RouteAccess = 'private' | 'guest';

export type RouteDecision = { kind: 'loading' } | { kind: 'allow' } | { kind: 'redirect'; to: string };

// Solo rutas internas: evita redirigir a otro dominio con returnTo=//ejemplo.com (open redirect)
function safeReturnTo(value: string | null): string {
  if (value?.startsWith('/') !== true || value.startsWith('//')) return ROUTES.board;
  return value;
}

// Decide qué hace una ruta según la sesión (RF-08):
// - Privada sin sesión → /login con la pantalla a la que volver y, si caducó, el motivo (RF-07).
// - De invitado (login, registro) con sesión → la pantalla de returnTo o el tablero.
// - Mientras se comprueba la sesión al arrancar → cargando.
export function useRouteAccess(access: RouteAccess): RouteDecision {
  const status = useAppSelector(selectAuthStatus);
  const expired = useAppSelector(selectSessionExpired);
  const { pathname, search } = useLocation();
  const [searchParams] = useSearchParams();

  if (status === 'unknown') return { kind: 'loading' };
  if (access === 'guest') {
    return status === 'authenticated'
      ? { kind: 'redirect', to: safeReturnTo(searchParams.get(RETURN_TO_PARAM)) }
      : { kind: 'allow' };
  }
  if (status === 'authenticated') return { kind: 'allow' };

  const params = new URLSearchParams({ [RETURN_TO_PARAM]: `${pathname}${search}` });
  if (expired) params.set(REASON_PARAM, REASON_EXPIRED);
  return { kind: 'redirect', to: `${ROUTES.login}?${params.toString()}` };
}
