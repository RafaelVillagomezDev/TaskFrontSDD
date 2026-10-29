import type { AuthState, AuthStatus } from './auth.slice';
import type { User } from '../schemas/user.schema';

// Los selectores solo necesitan la parte auth del estado: no dependen del store completo
interface StateWithAuth {
  auth: AuthState;
}

export const selectAuthStatus = (state: StateWithAuth): AuthStatus => state.auth.status;

export const selectCurrentUser = (state: StateWithAuth): User | null => state.auth.user;

export const selectCsrfToken = (state: StateWithAuth): string | null => state.auth.csrfToken;

export const selectIsAuthenticated = (state: StateWithAuth): boolean => state.auth.status === 'authenticated';

// Nombre visible en la navegación: el nombre o, si no tiene, el email (RF-50)
export const selectUserDisplayName = (state: StateWithAuth): string | null =>
  state.auth.user === null ? null : (state.auth.user.name ?? state.auth.user.email);
