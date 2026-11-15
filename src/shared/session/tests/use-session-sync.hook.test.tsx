import { act, renderHook } from '@testing-library/react';

import {
  FakeBroadcastChannel,
  installFakeBroadcastChannel,
  removeBroadcastChannel,
  restoreBroadcastChannel,
} from '@test-utils/fake-broadcast-channel';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import type { AppStore } from '@shared/store/store';
import { useSessionSync } from '../use-session-sync.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup(signedIn = true): { store: AppStore; unmount: () => void } {
  const store = freshStore();
  if (signedIn) store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  const { unmount } = renderHook(() => {
    useSessionSync();
  }, { wrapper: appWrapper(store, '/') });
  return { store, unmount };
}

// Mensaje que llega de otra pestaña por el canal que abrió el hook
function receive(data: unknown): void {
  const channel = FakeBroadcastChannel.instances.at(-1);
  if (channel === undefined) throw new Error('El hook no abrió el canal');
  act(() => {
    channel.receive(data);
  });
}

beforeEach(() => {
  installFakeBroadcastChannel();
});

afterEach(() => {
  restoreBroadcastChannel();
});

describe('useSessionSync', () => {
  it('RF-04: si otra pestaña cierra sesión, cierra la sesión aquí, sin mensaje de caducada', () => {
    const { store } = setup();
    receive({ type: 'session-ended', reason: 'signedOut' });
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', signedOut: true, expired: false });
  });

  it('RF-05: si la sesión caduca en otra pestaña, aquí también, con el mensaje de caducada', () => {
    const { store } = setup();
    receive({ type: 'session-ended', reason: 'expired' });
    expect(store.getState().auth).toMatchObject({ status: 'anonymous', signedOut: false, expired: true });
  });

  it('RF-06: ignora un mensaje que no es un aviso de fin de sesión', () => {
    const { store } = setup();
    receive({ type: 'session-ended', reason: 'hackeado' });
    receive('cualquier cosa');
    expect(store.getState().auth.status).toBe('authenticated');
  });

  it('con la sesión ya cerrada, un aviso no cambia nada', () => {
    const { store } = setup(false);
    const before = store.getState().auth;
    receive({ type: 'session-ended', reason: 'expired' });
    expect(store.getState().auth).toEqual(before);
  });

  it('plan D-3: al recibir un aviso no vuelve a avisar a las demás pestañas', () => {
    setup();
    receive({ type: 'session-ended', reason: 'signedOut' });
    expect(FakeBroadcastChannel.posted).toEqual([]);
  });

  it('cierra el canal al desmontar', () => {
    const { unmount } = setup();
    const channel = FakeBroadcastChannel.instances.at(-1);
    unmount();
    expect(channel?.closed).toBe(true);
  });

  it('RF-07: sin BroadcastChannel funciona sin errores', () => {
    removeBroadcastChannel();
    expect(() => setup()).not.toThrow();
  });
});
