import { useEffect } from 'react';

import { selectAuthStatus, sessionEnded, sessionExpired } from '@modules/auth';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { SESSION_CHANNEL, sessionEndMessageSchema } from './session-channel.util';

// Escucha el fin de la sesión en otras pestañas (spec 004 RF-04, RF-05, plan §4.2). Con la sesión abierta aquí,
// termina también esta: tras un cierre, sin mensaje de caducada ni pantalla a la que volver; tras una caducidad, con
// ellos (001 RF-07). La caché la borra el listener de fin de sesión (RF-01) y la ruta protegida lleva al inicio de
// sesión. No vuelve a avisar: solo avisa quien origina el fin (plan D-3). Sin BroadcastChannel, nada (RF-07)
export function useSessionSync(): void {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    const onMessage = (event: MessageEvent<unknown>) => {
      const message = sessionEndMessageSchema.safeParse(event.data);
      if (!message.success || status !== 'authenticated') return;
      dispatch(message.data.reason === 'expired' ? sessionExpired() : sessionEnded());
    };
    channel.addEventListener('message', onMessage);
    return () => {
      channel.removeEventListener('message', onMessage);
      channel.close();
    };
  }, [dispatch, status]);
}
