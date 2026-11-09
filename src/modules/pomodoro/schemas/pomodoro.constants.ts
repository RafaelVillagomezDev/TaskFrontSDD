// Duraciones fijas del formulario y la elegida por defecto, en minutos (spec RF-06)
export const DURATION_PRESETS: readonly number[] = [15, 25, 45, 60];
export const DEFAULT_DURATION = 25;
// Intervalo de la duración «Otra» (spec RF-07, API-004 RF-09)
export const MIN_DURATION = 1;
export const MAX_DURATION = 120;
// Máximo de tareas de una sesión entre nuevas y en espera (spec RF-13, API-004 RF-10)
export const MAX_SESSION_TASKS = 20;
// Primera página de las listas paginadas; la sesión activa es la primera sesión de esta página (spec RF-03)
export const FIRST_PAGE = 1;

export const SECONDS_PER_MINUTE = 60;
export const MS_PER_SECOND = 1000;
// Cada cuánto se recalcula la cuenta atrás; el valor se calcula, no se acumula (plan D-4)
export const COUNTDOWN_TICK_MS = 250;
// Espera antes del único reintento si la sesión sigue activa al llegar a cero (spec RF-18)
export const END_RETRY_DELAY_MS = 1000;
// Hitos que se anuncian a los lectores de pantalla, en segundos restantes (spec RF-64)
export const ANNOUNCE_MILESTONES_SECONDS: readonly number[] = [300, 60];

// Tono de fin generado con Web Audio (plan D-5): frecuencia en Hz, duración en ms y volumen de 0 a 1
export const END_SOUND_FREQUENCY_HZ = 880;
export const END_SOUND_DURATION_MS = 600;
export const END_SOUND_GAIN = 0.2;
