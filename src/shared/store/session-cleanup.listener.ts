import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import { sessionEnded } from '@modules/auth';
import { baseApi } from '@shared/api/base.api';
import { sessionExpired } from '@shared/api/session.actions';

// Borra de la memoria los datos de la cuenta en cuanto termina la sesión, por cierre, por borrado de la cuenta, por
// caducidad o por aviso de otra pestaña (spec 004 RF-01, RF-02, plan D-1). Así la siguiente cuenta que entre en la
// pestaña solo ve datos pedidos después de entrar. Un middleware por store: los tests crean varios
export function createSessionCleanup() {
  const listener = createListenerMiddleware();
  listener.startListening({
    matcher: isAnyOf(sessionEnded, sessionExpired),
    effect: (_action, api) => {
      api.dispatch(baseApi.util.resetApiState());
    },
  });
  return listener.middleware;
}
