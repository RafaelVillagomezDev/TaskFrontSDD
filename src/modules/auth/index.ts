// API pública del módulo auth: lo único que otros módulos y shared/ pueden importar (CONSTITUTION.md VI.4)
export {
  authReducer,
  csrfTokenSet,
  sessionCheckFailed,
  sessionEnded,
  sessionExpired,
  sessionStarted,
  userUpdated,
} from './store/auth.slice';
export type { AuthState, AuthStatus } from './store/auth.slice';
export {
  selectAuthStatus,
  selectCsrfToken,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionExpired,
  selectUserDisplayName,
} from './store/auth.selectors';
export { userSchema, type User } from './schemas/user.schema';
export { sessionSchema, type Session } from './schemas/user.schema';
export { authApi, useMeQuery } from './api/auth.api';
