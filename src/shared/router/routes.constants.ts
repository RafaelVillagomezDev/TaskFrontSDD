// Rutas de la aplicación (plan §6.1): en inglés, como el resto del código
export const ROUTES = {
  board: '/',
  taskDay: '/taskday',
  // Sección del pomodoro y sus vistas (003 RF-51 a RF-54)
  pomodoro: '/pomodoro',
  pomodoroHistory: '/pomodoro/history',
  pomodoroAchievements: '/pomodoro/achievements',
  history: '/history',
  alerts: '/alerts',
  account: '/account',
  login: '/login',
  register: '/register',
};

// Detalle de una sesión del historial (003 RF-54)
export function pomodoroSessionPath(id: string): string {
  return `${ROUTES.pomodoroHistory}/${id}`;
}

// Parámetros de la URL de inicio de sesión: pantalla a la que volver y motivo (RF-07, RF-08)
export const RETURN_TO_PARAM = 'returnTo';
export const REASON_PARAM = 'reason';
export const REASON_EXPIRED = 'expired';
