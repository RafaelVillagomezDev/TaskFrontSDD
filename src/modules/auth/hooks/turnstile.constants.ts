// Selector del <script> de Cloudflare Turnstile de index.html (spec 005 RF-01, plan D-1)
export const TURNSTILE_SCRIPT_SELECTOR = 'script[data-turnstile-script]';

// Si el script no ha cargado en este tiempo, el widget se da por no disponible (RF-06). Cubre el caso de un
// script asíncrono que falló antes de que la aplicación empezara a escucharlo
export const TURNSTILE_LOAD_TIMEOUT_MS = 10_000;

// Idioma del widget, el de la aplicación
export const TURNSTILE_LANGUAGE = 'es';
