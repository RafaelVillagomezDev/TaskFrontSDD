// API pública del módulo auth: lo único que otros módulos y shared/ pueden importar (CONSTITUTION.md VI.4)
export {
  authReducer,
  csrfTokenSet,
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
  selectUserDisplayName,
} from './store/auth.selectors';
export { userSchema, type User } from './schemas/user.schema';
