import { expect, jest } from '@jest/globals';
import { act, waitFor } from '@testing-library/react';

import type { TurnstileApi, TurnstileRenderOptions } from '@modules/auth';

// Prefijo de los tokens del doble: cada comprobación superada entrega uno distinto, como Cloudflare
export const FAKE_TURNSTILE_TOKEN = 'token-de-prueba';

export interface FakeTurnstile {
  render: jest.Mock<TurnstileApi['render']>;
  reset: jest.Mock<TurnstileApi['reset']>;
  remove: jest.Mock<TurnstileApi['remove']>;
  // Opciones del último widget pintado
  lastOptions: () => TurnstileRenderOptions;
  solve: () => string;
}

interface FakeTurnstileOptions {
  // Supera la comprobación al pintar y al reiniciar, como el widget managed con la site key de prueba que pasa
  autoSolve?: boolean;
}

// Doble de window.turnstile para Jest (spec 005; plan, sección 7). El script de Cloudflare nunca se carga
export function installFakeTurnstile({ autoSolve = false }: FakeTurnstileOptions = {}): FakeTurnstile {
  const rendered: TurnstileRenderOptions[] = [];
  let solved = 0;
  const lastOptions = (): TurnstileRenderOptions => {
    const options = rendered.at(-1);
    if (options === undefined) throw new Error('No se ha pintado ningún widget de Turnstile');
    return options;
  };
  const solve = (): string => {
    solved += 1;
    const token = `${FAKE_TURNSTILE_TOKEN}-${String(solved)}`;
    lastOptions().callback(token);
    return token;
  };
  const render = jest.fn<TurnstileApi['render']>((_container, options) => {
    rendered.push(options);
    if (autoSolve) solve();
    return `widget-${String(rendered.length)}`;
  });
  const reset = jest.fn<TurnstileApi['reset']>(() => {
    if (autoSolve) solve();
  });
  const remove = jest.fn<TurnstileApi['remove']>();
  window.turnstile = { render, reset, remove };
  return { render, reset, remove, lastOptions, solve };
}

export function uninstallFakeTurnstile(): void {
  Reflect.deleteProperty(window, 'turnstile');
}

interface TurnstileHolder {
  containerRef: (element: HTMLElement | null) => void;
  token: string | null;
}

// Para los tests de hooks con renderHook, sin página: da al widget un contenedor y espera a que el doble entregue
// el token (con autoSolve, el instalado por jest/setup.ts)
export async function attachTurnstile(widget: () => TurnstileHolder): Promise<void> {
  act(() => {
    widget().containerRef(document.createElement('div'));
  });
  await waitFor(() => {
    expect(widget().token).not.toBeNull();
  });
}
