import {
  FakeBroadcastChannel,
  installFakeBroadcastChannel,
  removeBroadcastChannel,
  restoreBroadcastChannel,
} from '@test-utils/fake-broadcast-channel';
import { announceSessionEnd, SESSION_CHANNEL, sessionEndMessageSchema } from '../session-channel.util';

afterEach(() => {
  restoreBroadcastChannel();
});

describe('announceSessionEnd', () => {
  it.each(['signedOut', 'expired'] as const)(
    'RF-04 y RF-05: avisa a las demás pestañas del fin de la sesión (%s) y cierra el canal',
    (reason) => {
      installFakeBroadcastChannel();
      announceSessionEnd(reason);

      expect(FakeBroadcastChannel.posted).toEqual([
        { name: SESSION_CHANNEL, message: { type: 'session-ended', reason } },
      ]);
      expect(FakeBroadcastChannel.instances[0]?.closed).toBe(true);
    },
  );

  it('RF-06: el aviso solo dice que la sesión terminó y por qué, sin datos de la cuenta ni de la sesión', () => {
    installFakeBroadcastChannel();
    announceSessionEnd('signedOut');
    // toStrictEqual falla si el mensaje lleva cualquier otro campo
    expect(FakeBroadcastChannel.posted[0]?.message).toStrictEqual({ type: 'session-ended', reason: 'signedOut' });
  });

  it('RF-07: sin BroadcastChannel no hace nada ni lanza un error', () => {
    removeBroadcastChannel();
    expect(() => {
      announceSessionEnd('expired');
    }).not.toThrow();
  });
});

describe('sessionEndMessageSchema', () => {
  it.each([
    [{ type: 'session-ended', reason: 'signedOut' }, true],
    [{ type: 'session-ended', reason: 'expired' }, true],
    [{ type: 'session-ended', reason: 'otro' }, false],
    [{ type: 'otro', reason: 'expired' }, false],
    ['session-ended', false],
    [null, false],
  ])('RF-06: valida el mensaje %j → %s', (message, valid) => {
    expect(sessionEndMessageSchema.safeParse(message).success).toBe(valid);
  });
});
