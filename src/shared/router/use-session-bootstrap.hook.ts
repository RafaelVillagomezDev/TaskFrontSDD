import { selectAuthStatus, useMeQuery, type AuthStatus } from '../../modules/auth';
import { useAppSelector } from '../store/hooks';

// Al arrancar comprueba la sesión con GET /me (plan §5.1): 200 → con sesión, 401 → sin ella. Sin efectos:
// la consulta es de RTK Query (VI.6) y su resultado lo guarda el endpoint en el slice auth.
// Con la sesión ya resuelta (inicio o cierre de sesión) no vuelve a consultar
export function useSessionBootstrap(): AuthStatus {
  const status = useAppSelector(selectAuthStatus);
  useMeQuery(undefined, { skip: status !== 'unknown' });
  return status;
}
