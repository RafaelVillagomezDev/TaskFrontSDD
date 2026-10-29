import type { ApiErrorCode } from '../api/api-error.util';

// Un mensaje por cada código de error, en español y sin el código técnico (spec RF-41, RNF-01)
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  ROUTE_NOT_FOUND: 'No se ha encontrado lo que buscabas. Vuelve a intentarlo desde el menú.',
  INVALID_CSRF_TOKEN: 'Tu sesión necesita actualizarse. Recarga la página e inténtalo de nuevo.',
  MISSING_TOKEN: 'Tienes que iniciar sesión para continuar.',
  INVALID_TOKEN: 'Tu sesión ya no es válida. Inicia sesión de nuevo.',
  TOKEN_EXPIRED: 'Tu sesión ha caducado. Inicia sesión de nuevo.',
  INVALID_REFRESH_TOKEN: 'Tu sesión ya no es válida. Inicia sesión de nuevo.',
  SESSION_EXPIRED: 'Tu sesión ha caducado. Inicia sesión de nuevo.',
  INVALID_CLIENT_TIME: 'La hora de tu dispositivo no es correcta. Revisa la fecha, la hora y la zona horaria.',
  INVALID_TIMEZONE: 'La zona horaria de tu dispositivo no es correcta. Revisa la fecha, la hora y la zona horaria.',
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.',
  INVALID_CREDENTIALS: 'El email o la contraseña no son correctos.',
  WRONG_PASSWORD: 'La contraseña no es correcta.',
  EMAIL_ALREADY_REGISTERED: 'Ya existe una cuenta con este email.',
  TASK_NOT_FOUND: 'Esta tarea ya no existe. Puede que se eliminara desde otra pestaña.',
  DAY_CLOSED: 'Ese día ya está cerrado: sus tareas no se pueden cambiar.',
  DAY_NOT_STARTED: 'Solo puedes completar tareas de hoy.',
  INTERNAL_ERROR: 'Algo ha fallado. Inténtalo de nuevo en unos segundos.',
  NETWORK_ERROR: 'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
};

// Bajo un campo que rechaza la API: el formulario ya valida sus reglas, así que solo se ve si la API y el
// cliente dejan de coincidir (RF-41)
export const INVALID_FIELD_MESSAGE = 'Revisa este campo.';
