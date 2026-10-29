import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { sessionExpired } from '../../../shared/api/session.actions';
import type { User } from '../schemas/user.schema';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

// Único slice del MVP (plan §4): estado de la sesión, nunca datos de la API (CONSTITUTION.md V.1)
export interface AuthState {
  status: AuthStatus;
  user: User | null;
  // Solo en memoria: nunca en localStorage ni sessionStorage (spec RNF-06)
  csrfToken: string | null;
  // La sesión terminó porque no se pudo renovar, no por cerrar sesión: el inicio de sesión lo avisa (RF-07)
  expired: boolean;
  // La sesión la cerró el usuario: la ruta privada lleva a /login sin returnTo (plan §5.1)
  signedOut: boolean;
}

const initialState: AuthState = { status: 'unknown', user: null, csrfToken: null, expired: false, signedOut: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionStarted(_state, action: PayloadAction<{ user: User; csrfToken: string }>): AuthState {
      return {
        status: 'authenticated',
        user: action.payload.user,
        csrfToken: action.payload.csrfToken,
        expired: false,
        signedOut: false,
      };
    },
    csrfTokenSet(state, action: PayloadAction<string>) {
      state.csrfToken = action.payload;
    },
    userUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    sessionEnded(): AuthState {
      return { status: 'anonymous', user: null, csrfToken: null, expired: false, signedOut: true };
    },
    // La comprobación inicial de GET /me falló: sin sesión, salvo que otra acción ya la haya resuelto
    sessionCheckFailed(state) {
      if (state.status === 'unknown') state.status = 'anonymous';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sessionExpired, (): AuthState => ({
      status: 'anonymous',
      user: null,
      csrfToken: null,
      expired: true,
      signedOut: false,
    }));
  },
});

export const { sessionStarted, csrfTokenSet, userUpdated, sessionEnded, sessionCheckFailed } = authSlice.actions;
export { sessionExpired };
export const authReducer = authSlice.reducer;
