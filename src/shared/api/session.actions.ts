import { createAction } from '@reduxjs/toolkit';

// La sesión no se pudo renovar (RF-07). La define la API base, que la despacha, y la escucha el slice auth:
// así shared/ no depende del módulo auth y no hay importaciones circulares
export const sessionExpired = createAction('auth/sessionExpired');
