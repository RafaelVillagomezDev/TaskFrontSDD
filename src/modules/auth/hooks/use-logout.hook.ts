import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import { baseApi } from '../../../shared/api/base.api';
import { ROUTES } from '../../../shared/router/routes.constants';
import { useAppDispatch } from '../../../shared/store/hooks';
import { useLogoutMutation } from '../api/auth.api';
import { sessionEnded } from '../store/auth.slice';

// Cerrar sesión (plan §5.1): avisa a la API, vacía la sesión y la caché y va al inicio de sesión reemplazando
// la entrada actual, para que «atrás» no vuelva a la pantalla privada. Aunque la API falle, la sesión local
// se cierra: el usuario ha pedido salir
export function useLogout(): { logout: () => void; isLoggingOut: boolean } {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutRequest, { isLoading }] = useLogoutMutation();

  const logout = useCallback(() => {
    void (async () => {
      await logoutRequest(undefined);
      dispatch(sessionEnded());
      dispatch(baseApi.util.resetApiState());
      await navigate(ROUTES.login, { replace: true });
    })();
  }, [dispatch, logoutRequest, navigate]);

  return { logout, isLoggingOut: isLoading };
}
