import type { TurnstileApi } from '../types/turnstile.types';
import { TURNSTILE_LOAD_TIMEOUT_MS, TURNSTILE_SCRIPT_SELECTOR } from './turnstile.constants';

// window.turnstile llega de un script externo: se comprueba en tiempo de ejecución, sin aserciones (plan D-3)
export function isTurnstileApi(value: unknown): value is TurnstileApi {
  return (
    typeof value === 'object' &&
    value !== null &&
    'render' in value &&
    typeof value.render === 'function' &&
    'reset' in value &&
    typeof value.reset === 'function' &&
    'remove' in value &&
    typeof value.remove === 'function'
  );
}

// API de Turnstile si el script ya la ha definido
export function loadedTurnstileApi(): TurnstileApi | null {
  const api = window.turnstile;
  return isTurnstileApi(api) ? api : null;
}

// Resuelve con la API de Turnstile en cuanto el script de index.html ha cargado; rechaza si falla, si no existe,
// si tarda más de timeoutMs o si se cancela. Al terminar quita sus listeners y su temporizador (plan D-4)
export function whenTurnstileReady(
  signal: AbortSignal,
  timeoutMs: number = TURNSTILE_LOAD_TIMEOUT_MS,
): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    const ready = loadedTurnstileApi();
    if (ready !== null) {
      resolve(ready);
      return;
    }
    const found = document.querySelector(TURNSTILE_SCRIPT_SELECTOR);
    if (found === null || signal.aborted) {
      reject(new Error('El script de Turnstile no está disponible'));
      return;
    }
    // Constante ya no nula: las funciones de abajo la usan sin perder el estrechamiento de tipo
    const script: Element = found;
    const onLoad = () => {
      const api = loadedTurnstileApi();
      if (api === null) {
        fail('El script de Turnstile no ha definido su API');
        return;
      }
      finish();
      resolve(api);
    };
    const onError = () => {
      fail('No se ha podido cargar el script de Turnstile');
    };
    const onAbort = () => {
      fail('Carga de Turnstile cancelada');
    };
    const timer = setTimeout(() => {
      fail('El script de Turnstile no ha cargado a tiempo');
    }, timeoutMs);
    function finish() {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
      clearTimeout(timer);
    }
    function fail(reason: string) {
      finish();
      reject(new Error(reason));
    }
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    signal.addEventListener('abort', onAbort);
  });
}
