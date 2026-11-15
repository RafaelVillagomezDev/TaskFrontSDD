import { jest } from '@jest/globals';

import { installFakeTurnstile, uninstallFakeTurnstile } from '@test-utils/fake-turnstile';
import { isTurnstileApi, whenTurnstileReady } from '../turnstile-api.util';

function addScript(): HTMLScriptElement {
  const script = document.createElement('script');
  script.dataset.turnstileScript = '';
  document.head.append(script);
  return script;
}

beforeEach(() => {
  uninstallFakeTurnstile();
});

afterEach(() => {
  document.head.innerHTML = '';
  jest.useRealTimers();
});

describe('isTurnstileApi', () => {
  it('RF-01: acepta un objeto con render, reset y remove', () => {
    expect(isTurnstileApi({ render: () => 'w', reset: () => undefined, remove: () => undefined })).toBe(true);
  });

  it.each([undefined, null, 'turnstile', {}, { render: () => 'w', reset: () => undefined }, { render: 1, reset: 1, remove: 1 }])(
    'RF-06: rechaza %p',
    (value) => {
      expect(isTurnstileApi(value)).toBe(false);
    },
  );
});

describe('whenTurnstileReady', () => {
  it('RF-01: resuelve en el acto si la API ya está cargada', async () => {
    const fake = installFakeTurnstile();
    await expect(whenTurnstileReady(new AbortController().signal)).resolves.toMatchObject({ render: fake.render });
  });

  it('RF-01: espera a que cargue el script y resuelve con la API', async () => {
    const script = addScript();
    const promise = whenTurnstileReady(new AbortController().signal);
    const fake = installFakeTurnstile();
    script.dispatchEvent(new Event('load'));
    await expect(promise).resolves.toMatchObject({ render: fake.render });
  });

  it('RF-06: rechaza si el script carga pero no define la API', async () => {
    const script = addScript();
    const promise = whenTurnstileReady(new AbortController().signal);
    script.dispatchEvent(new Event('load'));
    await expect(promise).rejects.toThrow('no ha definido su API');
  });

  it('RF-06: rechaza si el script falla (bloqueado o sin conexión)', async () => {
    const script = addScript();
    const promise = whenTurnstileReady(new AbortController().signal);
    script.dispatchEvent(new Event('error'));
    await expect(promise).rejects.toThrow('No se ha podido cargar');
  });

  it('RF-06: rechaza si no hay script en la página', async () => {
    await expect(whenTurnstileReady(new AbortController().signal)).rejects.toThrow('no está disponible');
  });

  it('RF-06: rechaza si el script no carga a tiempo y limpia sus listeners', async () => {
    jest.useFakeTimers();
    const script = addScript();
    const removeListener = jest.spyOn(script, 'removeEventListener');
    const promise = whenTurnstileReady(new AbortController().signal, 1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).rejects.toThrow('no ha cargado a tiempo');
    expect(removeListener).toHaveBeenCalledWith('load', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('error', expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('rechaza al cancelar y quita el temporizador', async () => {
    jest.useFakeTimers();
    addScript();
    const controller = new AbortController();
    const promise = whenTurnstileReady(controller.signal, 1000);
    const removeListener = jest.spyOn(controller.signal, 'removeEventListener');
    controller.abort();
    await expect(promise).rejects.toThrow('cancelada');
    expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('rechaza en el acto si ya estaba cancelada', async () => {
    addScript();
    const controller = new AbortController();
    controller.abort();
    await expect(whenTurnstileReady(controller.signal)).rejects.toThrow('no está disponible');
  });
});
