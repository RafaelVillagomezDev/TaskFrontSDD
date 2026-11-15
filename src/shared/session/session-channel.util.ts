import { z } from 'zod';

// Canal entre las pestañas de la aplicación en un mismo navegador (spec 004 RF-04 a RF-07, plan D-2): BroadcastChannel
// no guarda nada en el navegador, a diferencia del evento storage, que obliga a escribir en localStorage (001 RNF-06)
export const SESSION_CHANNEL = 'kompitu-session';

// El aviso solo dice que la sesión terminó y por qué (RF-06): cerrar sesión o borrar la cuenta (signedOut) o caducidad
// (expired). Lo que llega de otra pestaña se valida antes de usarlo
export const sessionEndMessageSchema = z
  .object({
    type: z.literal('session-ended'),
    reason: z.enum(['signedOut', 'expired']),
  })
  .strict();

export type SessionEndMessage = z.infer<typeof sessionEndMessageSchema>;
export type SessionEndReason = SessionEndMessage['reason'];

// Avisa a las demás pestañas de que la sesión ha terminado. Solo lo llama quien origina el fin (plan D-3), así que la
// pestaña que recibe no vuelve a avisar. Sin BroadcastChannel no hace nada: cada pestaña lo detectará en su siguiente
// petición a la API (RF-07)
export function announceSessionEnd(reason: SessionEndReason): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(SESSION_CHANNEL);
  try {
    channel.postMessage({ type: 'session-ended', reason } satisfies SessionEndMessage);
  } finally {
    channel.close();
  }
}
