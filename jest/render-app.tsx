import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
  useLocation,
  useNavigationType,
  type RouteObject,
} from 'react-router';

import { createAppStore, type AppStore } from '../src/shared/store/store';

// Store real y router en memoria para los tests de hooks y páginas
export function appWrapper(
  store: AppStore,
  initialEntry: string | { pathname: string; search?: string; state?: unknown },
) {
  return function AppWrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      </Provider>
    );
  };
}

export function freshStore(): AppStore {
  return createAppStore();
}

// Ubicación actual y tipo de la última navegación, para usar junto al hook probado en renderHook
export function useRouterProbe() {
  const location = useLocation();
  return { location, navigationType: useNavigationType() };
}

// La aplicación completa (rutas reales) en una URL, con un router de datos en memoria
export function routerAt(routes: RouteObject[], path: string | { pathname: string; state?: unknown }) {
  return createMemoryRouter(routes, { initialEntries: [path] });
}

export function AppUnderTest({ store, router }: { store: AppStore; router: ReturnType<typeof createMemoryRouter> }) {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
