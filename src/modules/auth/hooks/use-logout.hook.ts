import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { ROUTES } from '@shared/router/routes.constants';
import { announceSessionEnd } from '@shared/session/session-channel.util';
import { useAppDispatch } from '@shared/store/hooks';
import { useLogoutMutation } from '../api/auth.api';
import { sessionEnded } from '../store/auth.slice';

// Cerrar sesión (plan §5.1): avisa a la API, vacía la sesión y va al inicio de sesión reemplazando la entrada actual,
// para que «atrás» no vuelva a la pantalla privada. Aunque la API falle, la sesión local se cierra: el usuario ha
// pedido salir. La caché la borra el listener de fin de sesión (spec 004 RF-01) y las demás pestañas se enteran por el
// canal de sesión (spec 004 RF-04)
export function useLogout(): { logout: () => void; isLoggingOut: boolean } {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutRequest, { isLoading }] = useLogoutMutation();

  const logout = useCallback(() => {
    void (async () => {
      await logoutRequest(undefined);
      dispatch(sessionEnded());
      announceSessionEnd('signedOut');
      await navigate(ROUTES.login, { replace: true });
    })();
  }, [dispatch, logoutRequest, navigate]);

  return { logout, isLoggingOut: isLoading };
}
