// Parte de la API de Cloudflare Turnstile (window.turnstile) que usa la aplicación, con render explícito
// (spec 005 RF-01, RF-02; plan D-2, D-3). Sin dependencia de tipos: se declara lo que se usa

// Acción fija de cada formulario, que la API compara con la que devuelve Cloudflare (API-005 RF-06)
export type TurnstileAction = 'login' | 'register';

export interface TurnstileRenderOptions {
  sitekey: string;
  action: TurnstileAction;
  theme: 'auto' | 'light' | 'dark';
  size: 'normal' | 'flexible' | 'compact';
  language: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
  'error-callback': () => void;
}

export interface TurnstileApi {
  // Devuelve el identificador del widget pintado en el contenedor
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | null | undefined;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: unknown;
  }
}
