import {
  authReducer,
  csrfTokenSet,
  sessionCheckFailed,
  sessionEnded,
  sessionExpired,
  sessionStarted,
  userUpdated,
} from '../auth.slice';
import {
  selectAuthStatus,
  selectCsrfToken,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionExpired,
  selectSignedOut,
  selectUserDisplayName,
} from '../auth.selectors';

const ana = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T09:00:00Z' };

describe('slice auth', () => {
  it('empieza con la sesión sin comprobar', () => {
    const state = authReducer(undefined, { type: '@@init' });
    expect(state).toEqual({ status: 'unknown', user: null, csrfToken: null, expired: false, signedOut: false });
  });

  it('sessionStarted guarda el usuario y el token CSRF solo en memoria (RNF-06)', () => {
    const state = authReducer(undefined, sessionStarted({ user: ana, csrfToken: 'csrf-1' }));
    expect(state).toEqual({
      status: 'authenticated',
      user: ana,
      csrfToken: 'csrf-1',
      expired: false,
      signedOut: false,
    });
  });

  it('csrfTokenSet cambia solo el token', () => {
    const started = authReducer(undefined, sessionStarted({ user: ana, csrfToken: 'csrf-1' }));
    expect(authReducer(started, csrfTokenSet('csrf-2')).csrfToken).toBe('csrf-2');
  });

  it('RF-53: userUpdated cambia el usuario de la sesión', () => {
    const started = authReducer(undefined, sessionStarted({ user: ana, csrfToken: 'csrf-1' }));
    const updated = authReducer(started, userUpdated({ ...ana, name: 'Ana García' }));
    expect(updated.user?.name).toBe('Ana García');
  });

  it('sessionEnded deja la sesión anónima, olvida usuario y token y marca que la cerró el usuario', () => {
    const started = authReducer(undefined, sessionStarted({ user: ana, csrfToken: 'csrf-1' }));
    expect(authReducer(started, sessionEnded())).toEqual({
      status: 'anonymous',
      user: null,
      csrfToken: null,
      expired: false,
      signedOut: true,
    });
    const again = authReducer(authReducer(started, sessionEnded()), sessionStarted({ user: ana, csrfToken: 'c' }));
    expect(again.signedOut).toBe(false);
  });

  it('RF-08: sessionCheckFailed deja sin sesión solo si aún no se sabía', () => {
    expect(authReducer(undefined, sessionCheckFailed()).status).toBe('anonymous');
    const started = authReducer(undefined, sessionStarted({ user: ana, csrfToken: 'csrf-1' }));
    expect(authReducer(started, sessionCheckFailed()).status).toBe('authenticated');
  });

  it('RF-07: sessionExpired deja la sesión anónima y marca que caducó', () => {
    const started = authReducer(undefined, sessionStarted({ user: ana, csrfToken: 'csrf-1' }));
    expect(authReducer(started, sessionExpired())).toEqual({
      status: 'anonymous',
      user: null,
      csrfToken: null,
      expired: true,
      signedOut: false,
    });
  });
});

describe('selectores de auth', () => {
  const authenticated = { auth: authReducer(undefined, sessionStarted({ user: ana, csrfToken: 'csrf-1' })) };
  const anonymous = { auth: authReducer(undefined, sessionEnded()) };

  it('devuelven estado, usuario y token', () => {
    expect(selectAuthStatus(authenticated)).toBe('authenticated');
    expect(selectCurrentUser(authenticated)).toEqual(ana);
    expect(selectCsrfToken(authenticated)).toBe('csrf-1');
    expect(selectIsAuthenticated(authenticated)).toBe(true);
    expect(selectIsAuthenticated(anonymous)).toBe(false);
  });

  it('selectSignedOut indica si el usuario cerró la sesión', () => {
    expect(selectSignedOut(anonymous)).toBe(true);
    expect(selectSignedOut(authenticated)).toBe(false);
  });

  it('RF-07: selectSessionExpired indica si la sesión caducó', () => {
    expect(selectSessionExpired(anonymous)).toBe(false);
    expect(selectSessionExpired({ auth: authReducer(undefined, sessionExpired()) })).toBe(true);
  });

  it('RF-50: el nombre visible es el nombre o, si no tiene, el email', () => {
    expect(selectUserDisplayName(authenticated)).toBe('Ana');
    const withoutName = {
      auth: authReducer(undefined, sessionStarted({ user: { ...ana, name: null }, csrfToken: 'x' })),
    };
    expect(selectUserDisplayName(withoutName)).toBe('ana@example.com');
    expect(selectUserDisplayName(anonymous)).toBeNull();
  });
});
