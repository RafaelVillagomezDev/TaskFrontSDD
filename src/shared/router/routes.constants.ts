// Rutas de la aplicación (plan §6.1): en inglés, como el resto del código
export const ROUTES = {
  board: '/',
  history: '/history',
  alerts: '/alerts',
  account: '/account',
  login: '/login',
  register: '/register',
};

// Parámetros de la URL de inicio de sesión: pantalla a la que volver y motivo (RF-07, RF-08)
export const RETURN_TO_PARAM = 'returnTo';
export const REASON_PARAM = 'reason';
export const REASON_EXPIRED = 'expired';
