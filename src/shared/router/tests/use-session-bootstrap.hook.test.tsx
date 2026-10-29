import type { ReactNode } from 'react';
import { jest } from '@jest/globals';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter } from 'react-router';

import { apiFail, apiOk, mockApi } from '../../../../jest/mock-api';
import { sessionEnded, sessionStarted } from '../../../modules/auth';
import { createAppStore, type AppStore } from '../../store/store';
import { AppRoot } from '../app-root.component';
import { useSessionBootstrap } from '../use-session-bootstrap.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function wrapperFor(store: AppStore) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

function meRequests(store: AppStore): string[] {
  return Object.keys(store.getState().api.queries).filter((key) => key.startsWith('me('));
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RF-08: useSessionBootstrap', () => {
  it('con la sesión sin comprobar consulta GET /me; con 200 abre la sesión', async () => {
    mockApi({ 'GET /me': () => apiOk({ user: USER, csrfToken: 'csrf-1' }) });
    const store = createAppStore();
    const { result } = renderHook(() => useSessionBootstrap(), { wrapper: wrapperFor(store) });
    expect(result.current).toBe('unknown');
    await waitFor(() => {
      expect(result.current).toBe('authenticated');
    });
    expect(store.getState().auth.csrfToken).toBe('csrf-1');
  });

  it('con 401 queda sin sesión', async () => {
    mockApi({ 'GET /me': () => apiFail(401, 'MISSING_TOKEN') });
    const store = createAppStore();
    const { result } = renderHook(() => useSessionBootstrap(), { wrapper: wrapperFor(store) });
    expect(result.current).toBe('unknown');
    expect(meRequests(store)).toHaveLength(1);
    await waitFor(() => {
      expect(result.current).toBe('anonymous');
    });
  });

  it('con la sesión ya abierta no consulta nada', () => {
    const store = createAppStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'csrf-1' }));
    const { result } = renderHook(() => useSessionBootstrap(), { wrapper: wrapperFor(store) });
    expect(result.current).toBe('authenticated');
    expect(meRequests(store)).toHaveLength(0);
  });

  it('tras cerrar sesión no vuelve a consultar', () => {
    const store = createAppStore();
    store.dispatch(sessionEnded());
    renderHook(() => useSessionBootstrap(), { wrapper: wrapperFor(store) });
    expect(meRequests(store)).toHaveLength(0);
  });
});

describe('AppRoot', () => {
  it('comprueba la sesión y pinta las rutas', () => {
    const store = createAppStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'csrf-1' }));
    const router = createMemoryRouter([{ path: '/', element: <p>Inicio</p> }]);
    render(
      <Provider store={store}>
        <AppRoot router={router} />
      </Provider>,
    );
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });
});
