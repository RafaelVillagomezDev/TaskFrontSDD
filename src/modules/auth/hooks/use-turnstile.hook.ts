import { useCallback, useEffect, useRef, useState } from 'react';

import { env } from '@shared/config/env';
import { AUTH_TEXTS } from '../texts/auth.texts';
import type { TurnstileAction, TurnstileApi } from '../types/turnstile.types';
import { loadedTurnstileApi, whenTurnstileReady } from './turnstile-api.util';
import { TURNSTILE_LANGUAGE } from './turnstile.constants';

// loading: esperando al script; ready: widget pintado sin token; solved: token disponible; error: no disponible
export type TurnstileStatus = 'loading' | 'ready' | 'solved' | 'error';

export interface TurnstileWidget {
  // Callback ref del contenedor donde Cloudflare pinta el widget
  containerRef: (element: HTMLElement | null) => void;
  token: string | null;
  status: TurnstileStatus;
  // Estado para lectores de pantalla (RNF-01)
  statusText: string;
  // Descarta el token y pide otro: cada token sirve para un solo intento (RF-05)
  reset: () => void;
}

interface WidgetState {
  status: TurnstileStatus;
  token: string | null;
}

interface RenderedWidget {
  api: TurnstileApi;
  id: string;
}

const INITIAL_STATE: WidgetState = { status: 'loading', token: null };

// Widget de Cloudflare Turnstile con render explícito (spec 005 RF-01 a RF-06; plan 4.1, D-2, D-4). Un efecto
// por contenedor y acción: espera al script, pinta el widget y, en la limpieza, cancela la espera y lo quita.
// Los callbacks que llegan tras la limpieza no cambian el estado
export function useTurnstile(action: TurnstileAction): TurnstileWidget {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [state, setState] = useState<WidgetState>(INITIAL_STATE);
  const widget = useRef<RenderedWidget | null>(null);

  useEffect(() => {
    if (container === null) return undefined;
    const controller = new AbortController();
    const { signal } = controller;
    const update = (next: WidgetState) => {
      if (!signal.aborted) setState(next);
    };
    let rendered: RenderedWidget | null = null;

    const mount = (api: TurnstileApi) => {
      update({ status: 'ready', token: null });
      const id = api.render(container, {
        sitekey: env.turnstileSiteKey,
        action,
        theme: 'auto',
        size: 'flexible',
        language: TURNSTILE_LANGUAGE,
        callback: (token) => {
          update({ status: 'solved', token });
        },
        // Cloudflare pide un token nuevo por su cuenta al caducar (RF-04)
        'expired-callback': () => {
          update({ status: 'ready', token: null });
        },
        'timeout-callback': () => {
          update({ status: 'ready', token: null });
        },
        'error-callback': () => {
          update({ status: 'error', token: null });
        },
      });
      if (typeof id !== 'string') throw new Error('Turnstile no ha pintado el widget');
      rendered = { api, id };
      widget.current = rendered;
    };

    // Script bloqueado, sin conexión o widget que no se pinta (RF-06)
    const fail = () => {
      update({ status: 'error', token: null });
    };

    const loaded = loadedTurnstileApi();
    if (loaded === null) {
      void (async () => {
        try {
          const api = await whenTurnstileReady(signal);
          if (!signal.aborted) mount(api);
        } catch {
          fail();
        }
      })();
    } else {
      // Con el script ya cargado se pinta en el acto, sin esperar a otra vuelta del bucle de eventos
      try {
        mount(loaded);
      } catch {
        fail();
      }
    }

    return () => {
      controller.abort();
      if (rendered !== null) rendered.api.remove(rendered.id);
      widget.current = null;
    };
  }, [action, container]);

  const reset = useCallback(() => {
    setState((current) => (current.status === 'error' ? current : { status: 'ready', token: null }));
    const current = widget.current;
    if (current !== null) current.api.reset(current.id);
  }, []);

  return {
    containerRef: setContainer,
    token: state.token,
    status: state.status,
    statusText: AUTH_TEXTS.turnstile.status[state.status],
    reset,
  };
}
