import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '../../../../../jest/render-app';
import { sessionStarted } from '../../store/auth.slice';
import { useLogout } from '../use-logout.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  const view = renderHook(() => ({ logout: useLogout(), router: useRouterProbe() }), {
    wrapper: appWrapper(store, '/history'),
  });
  return { ...view, store };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useLogout', () => {
  it('avisa a la API, vacía la sesión y la caché y navega a /login reemplazando la entrada', async () => {
    const api = mockApi({ 'POST /auth/logout': () => apiOk(null) });
    const { result, store } = setup();
    act(() => {
      result.current.logout.logout();
    });
    await waitFor(() => {
      expect(result.current.router.location.pathname).toBe('/login');
    });
    expect(result.current.router.navigationType).toBe('REPLACE');
    expect(store.getState().auth).toEqual({
      status: 'anonymous',
      user: null,
      csrfToken: null,
      expired: false,
      signedOut: true,
    });
    expect(store.getState().api.mutations).toEqual({});
    expect(api.requests[0]?.headers.get('X-CSRF-Token')).toBe('sesion-1');
  });

  it('aunque la API falle, cierra la sesión local', async () => {
    mockApi({ 'POST /auth/logout': () => apiFail(403, 'INVALID_CSRF_TOKEN') });
    const { result, store } = setup();
    act(() => {
      result.current.logout.logout();
    });
    await waitFor(() => {
      expect(store.getState().auth.status).toBe('anonymous');
    });
    expect(result.current.router.location.pathname).toBe('/login');
  });
});
