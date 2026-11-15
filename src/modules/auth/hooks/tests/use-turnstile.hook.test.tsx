import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { installFakeTurnstile, uninstallFakeTurnstile, type FakeTurnstile } from '@test-utils/fake-turnstile';
import type { TurnstileAction } from '../../types/turnstile.types';
import { useTurnstile } from '../use-turnstile.hook';

let fake: FakeTurnstile;

beforeEach(() => {
  fake = installFakeTurnstile();
});

afterEach(() => {
  document.head.innerHTML = '';
  jest.useRealTimers();
});

function setup(action: TurnstileAction = 'login') {
  const view = renderHook(({ current }: { current: TurnstileAction }) => useTurnstile(current), {
    initialProps: { current: action },
  });
  const container = document.createElement('div');
  act(() => {
    view.result.current.containerRef(container);
  });
  return { ...view, container };
}

async function rendered(result: ReturnType<typeof setup>['result']) {
  await waitFor(() => {
    expect(result.current.status).toBe('ready');
  });
}

describe('useTurnstile', () => {
  it('RF-01: sin contenedor no pinta nada y anuncia que está cargando', () => {
    const { result } = renderHook(() => useTurnstile('login'));
    expect(fake.render).not.toHaveBeenCalled();
    expect(result.current.status).toBe('loading');
    expect(result.current.statusText).toBe('Cargando la comprobación de seguridad…');
  });

  it('RF-01, RF-02: pinta el widget con la site key, la acción, el tema del sistema y en español', async () => {
    const { result, container } = setup('register');
    await rendered(result);
    expect(fake.render).toHaveBeenCalledWith(container, expect.objectContaining({ sitekey: '1x00000000000000000000AA' }));
    expect(fake.lastOptions()).toMatchObject({ action: 'register', theme: 'auto', size: 'flexible', language: 'es' });
    expect(result.current.token).toBeNull();
  });

  it('RF-01: guarda el token cuando se supera la comprobación', async () => {
    const { result } = setup();
    await rendered(result);
    let token = '';
    act(() => {
      token = fake.solve();
    });
    expect(result.current.token).toBe(token);
    expect(result.current.status).toBe('solved');
    expect(result.current.statusText).toBe('Comprobación completada.');
  });

  it('RF-04: descarta el token cuando caduca o se agota el tiempo', async () => {
    const { result } = setup();
    await rendered(result);
    act(() => {
      fake.solve();
      fake.lastOptions()['expired-callback']();
    });
    expect(result.current.token).toBeNull();
    expect(result.current.status).toBe('ready');
    act(() => {
      fake.solve();
      fake.lastOptions()['timeout-callback']();
    });
    expect(result.current.token).toBeNull();
  });

  it('RF-05: reset descarta el token y reinicia el widget', async () => {
    const { result } = setup();
    await rendered(result);
    act(() => {
      fake.solve();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.token).toBeNull();
    expect(fake.reset).toHaveBeenCalledWith('widget-1');
  });

  it('RF-06: un error de Cloudflare deja el widget no disponible, también tras reset', async () => {
    const { result } = setup();
    await rendered(result);
    act(() => {
      fake.lastOptions()['error-callback']();
    });
    expect(result.current.status).toBe('error');
    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe('error');
  });

  it('RF-06: sin el script de Cloudflare el widget no está disponible', async () => {
    uninstallFakeTurnstile();
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.statusText).toBe('La comprobación de seguridad no está disponible.');
  });

  it('RF-06: si Cloudflare no pinta el widget, no está disponible', async () => {
    fake.render.mockReturnValue(undefined);
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });

  it('quita el widget al desmontar y no aplica callbacks posteriores', async () => {
    const { result, unmount } = setup();
    await rendered(result);
    const options = fake.lastOptions();
    unmount();
    expect(fake.remove).toHaveBeenCalledWith('widget-1');
    options.callback('tarde');
    expect(result.current.token).toBeNull();
  });

  it('reset tras desmontar no llama a Cloudflare', async () => {
    const { result, unmount } = setup();
    await rendered(result);
    const { reset } = result.current;
    unmount();
    reset();
    expect(fake.reset).not.toHaveBeenCalled();
  });

  it('al cambiar de acción quita el widget anterior y pinta uno nuevo', async () => {
    const { result, rerender } = setup('login');
    await rendered(result);
    rerender({ current: 'register' });
    await waitFor(() => {
      expect(fake.render).toHaveBeenCalledTimes(2);
    });
    expect(fake.remove).toHaveBeenCalledWith('widget-1');
    expect(fake.lastOptions().action).toBe('register');
  });

  it('desmontar antes de que cargue el script no pinta nada ni deja listeners ni temporizadores', () => {
    jest.useFakeTimers();
    uninstallFakeTurnstile();
    const script = document.createElement('script');
    script.dataset.turnstileScript = '';
    document.head.append(script);
    const { unmount } = setup();
    unmount();
    const late = installFakeTurnstile();
    script.dispatchEvent(new Event('load'));
    expect(late.render).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cambios rápidos de contenedor solo dejan un widget pintado, en el último', async () => {
    const { result } = setup();
    const second = document.createElement('div');
    act(() => {
      result.current.containerRef(second);
    });
    await rendered(result);
    expect(fake.render).toHaveBeenLastCalledWith(second, expect.anything());
    expect(fake.remove).toHaveBeenCalledWith('widget-1');
    expect(fake.render.mock.calls.length - fake.remove.mock.calls.length).toBe(1);
  });
});
