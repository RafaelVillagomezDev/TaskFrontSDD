import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation, useRoutes } from 'react-router';

import { sessionCheckFailed, sessionEnded, sessionExpired, sessionStarted } from '../../../modules/auth';
import { createAppStore } from '../../store/store';
import { APP_ROUTES } from '../router';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

type Session = 'unknown' | 'anonymous' | 'authenticated' | 'expired' | 'signedOut';

// URL actual, pintada por una sonda (los routers de datos necesitan Request, que jsdom no tiene)
function App() {
  const { pathname, search } = useLocation();
  return (
    <>
      <span data-testid="location">{`${pathname}${search}`}</span>
      {useRoutes(APP_ROUTES)}
    </>
  );
}

function renderAt(path: string, session: Session) {
  const store = createAppStore();
  if (session === 'anonymous') store.dispatch(sessionCheckFailed());
  if (session === 'signedOut') store.dispatch(sessionEnded());
  if (session === 'expired') store.dispatch(sessionExpired());
  if (session === 'authenticated') store.dispatch(sessionStarted({ user: USER, csrfToken: 'csrf-1' }));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );
  return { store };
}

function currentUrl(): URL {
  return new URL(screen.getByTestId('location').textContent, 'http://kompitu.test');
}

describe('RF-08: ProtectedRoute', () => {
  it.each(['/', '/history', '/alerts', '/account'])('sin sesión, %s lleva a /login con returnTo', (path) => {
    renderAt(path, 'anonymous');
    expect(`${currentUrl().pathname}${currentUrl().search}`).toBe(`/login?returnTo=${encodeURIComponent(path)}`);
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('conserva los parámetros de la pantalla en returnTo', () => {
    renderAt('/history?status=completed&page=2', 'anonymous');
    expect(currentUrl().pathname).toBe('/login');
    expect(currentUrl().searchParams.get('returnTo')).toBe('/history?status=completed&page=2');
  });

  it('RF-07: si la sesión caducó, añade reason=expired', () => {
    renderAt('/alerts', 'expired');
    const params = currentUrl().searchParams;
    expect(params.get('returnTo')).toBe('/alerts');
    expect(params.get('reason')).toBe('expired');
  });

  it('tras cerrar sesión el usuario, lleva a /login sin returnTo', () => {
    renderAt('/history', 'signedOut');
    expect(`${currentUrl().pathname}${currentUrl().search}`).toBe('/login');
  });

  it("con status 'unknown' muestra el cargador y no redirige", () => {
    renderAt('/history', 'unknown');
    expect(screen.getByRole('status', { name: 'Comprobando la sesión…' })).toBeInTheDocument();
    expect(currentUrl().pathname).toBe('/history');
  });

  it('con sesión pinta la pantalla privada dentro del shell', () => {
    renderAt('/history', 'authenticated');
    expect(screen.getByRole('heading', { level: 1, name: 'Historial' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('una ruta desconocida lleva al tablero (y sin sesión, al inicio de sesión)', () => {
    renderAt('/no-existe', 'authenticated');
    expect(currentUrl().pathname).toBe('/');
  });
});

describe('RF-07: rutas de invitado (inicio de sesión y registro)', () => {
  it('sin sesión se pueden abrir', () => {
    renderAt('/register', 'anonymous');
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
  });

  it('con sesión, el inicio de sesión vuelve a la pantalla de returnTo', () => {
    renderAt('/login?returnTo=%2Falerts', 'authenticated');
    expect(currentUrl().pathname).toBe('/alerts');
  });

  it('sin returnTo, va al tablero', () => {
    renderAt('/register', 'authenticated');
    expect(currentUrl().pathname).toBe('/');
  });

  it.each(['https://malo.example', '//malo.example', 'alerts'])('ignora un returnTo externo o relativo: %s', (to) => {
    renderAt(`/login?returnTo=${encodeURIComponent(to)}`, 'authenticated');
    expect(currentUrl().pathname).toBe('/');
  });

  it('al iniciar sesión en /login vuelve sola a returnTo', () => {
    const { store } = renderAt('/login?returnTo=%2Fhistory', 'anonymous');
    act(() => {
      store.dispatch(sessionStarted({ user: USER, csrfToken: 'csrf-1' }));
    });
    expect(currentUrl().pathname).toBe('/history');
  });
});

describe('RF-50 y RF-54: shell de las pantallas privadas', () => {
  it('muestra la navegación con la pantalla activa', () => {
    renderAt('/alerts', 'authenticated');
    const sidebar = screen.getByRole('complementary');
    expect(within(sidebar).getByRole('link', { name: 'Avisos' })).toHaveAttribute('aria-current', 'page');
  });

  it('el menú abre la navegación en un Drawer, que se cierra al cambiar de pantalla', async () => {
    const user = userEvent.setup();
    renderAt('/', 'authenticated');
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const drawer = screen.getByRole('dialog', { name: 'Menú' });
    await user.click(within(drawer).getByRole('link', { name: 'Historial' }));
    expect(currentUrl().pathname).toBe('/history');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el Drawer se cierra con su botón', async () => {
    const user = userEvent.setup();
    renderAt('/', 'authenticated');
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
