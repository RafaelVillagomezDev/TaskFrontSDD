import type { ReactNode } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bell } from 'lucide-react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';

import { sessionStarted } from '../../../modules/auth';
import { createAppStore } from '../../store/store';
import { MainNavigation } from '../main-navigation.component';
import { NavItem } from '../nav-item.component';
import { useNavigationDrawer } from '../use-navigation-drawer.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };

function renderNavigation(path: string, name: string | null = 'Ana') {
  const store = createAppStore();
  store.dispatch(sessionStarted({ user: { ...USER, name }, csrfToken: 'csrf-1' }));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <MainNavigation>
          <button type="button">Cerrar sesión</button>
        </MainNavigation>
      </MemoryRouter>
    </Provider>,
  );
}

describe('RF-50: MainNavigation', () => {
  it('da acceso al tablero, al historial, a los avisos y a la cuenta, con el nombre del usuario', () => {
    renderNavigation('/');
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tablero' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/history');
    expect(screen.getByRole('link', { name: 'Avisos' })).toHaveAttribute('href', '/alerts');
    expect(screen.getByRole('link', { name: 'Cuenta' })).toHaveAttribute('href', '/account');
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('sin nombre muestra el email; si no cabe se recorta y se lee entero al pasar el ratón', () => {
    renderNavigation('/', null);
    const email = screen.getByText('ana@example.com');
    expect(email.className).toContain('truncate');
    expect(email).toHaveAttribute('title', 'ana@example.com');
  });
});

describe('RF-54: NavItem', () => {
  it('marca la pantalla activa con aria-current y los estilos de DESIGN.md', () => {
    renderNavigation('/history');
    const active = screen.getByRole('link', { name: 'Historial' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.className).toContain('border-primary');
    expect(active.className).toContain('bg-nav-active');
    expect(active.className).toContain('min-h-touch');
  });

  it('el tablero ("/") no queda activo en otras pantallas', () => {
    renderNavigation('/history');
    expect(screen.getByRole('link', { name: 'Tablero' })).not.toHaveAttribute('aria-current');
  });

  it('navega con teclado', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <NavItem to="/alerts" icon={Bell}>
          Avisos
        </NavItem>
        <Routes>
          <Route path="/alerts" element={<p>Pantalla de avisos</p>} />
          <Route path="/" element={null} />
        </Routes>
      </MemoryRouter>,
    );
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Pantalla de avisos')).toBeInTheDocument();
  });
});

describe('useNavigationDrawer', () => {
  function wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>;
  }

  it('abre y cierra', () => {
    const { result } = renderHook(() => useNavigationDrawer(), { wrapper });
    expect(result.current.open).toBe(false);
    act(() => {
      result.current.onOpenChange(true);
    });
    expect(result.current.open).toBe(true);
    act(() => {
      result.current.onOpenChange(false);
    });
    expect(result.current.open).toBe(false);
  });

  it('se cierra al cambiar de pantalla', () => {
    const { result } = renderHook(() => ({ drawer: useNavigationDrawer(), navigate: useNavigate() }), { wrapper });
    act(() => {
      result.current.drawer.onOpenChange(true);
    });
    act(() => {
      void result.current.navigate('/history');
    });
    expect(result.current.drawer.open).toBe(false);
  });
});
