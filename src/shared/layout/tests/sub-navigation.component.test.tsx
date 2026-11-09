import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';

import { SubNavigation } from '../sub-navigation.component';

function renderSubNavigation(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SubNavigation aria-label="Secciones del pomodoro">
        <SubNavigation.Link to="/pomodoro">Sesión</SubNavigation.Link>
        <SubNavigation.Link to="/pomodoro/history" matchSubroutes>
          Historial
        </SubNavigation.Link>
      </SubNavigation>
      <Routes>
        <Route path="/pomodoro" element={<p>Pantalla de sesión</p>} />
        <Route path="/pomodoro/history/*" element={<p>Pantalla de historial</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RF-51 (003): SubNavigation', () => {
  it('es una navegación con nombre y una lista de enlaces', () => {
    renderSubNavigation('/pomodoro');
    const nav = screen.getByRole('navigation', { name: 'Secciones del pomodoro' });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/pomodoro/history');
  });

  it('marca como activo solo el enlace de la vista actual, con los estilos de DESIGN.md', () => {
    renderSubNavigation('/pomodoro');
    const active = screen.getByRole('link', { name: 'Sesión' });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.className).toContain('border-primary');
    expect(active.className).toContain('text-primary-text');
    expect(screen.getByRole('link', { name: 'Historial' })).not.toHaveAttribute('aria-current');
  });

  it('con matchSubroutes sigue activo en el detalle; sin él, «Sesión» no se marca en una subruta', () => {
    renderSubNavigation('/pomodoro/history/p-1');
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Sesión' })).not.toHaveAttribute('aria-current');
  });

  it('cada enlace mide al menos 44 px de alto (objetivo táctil) y se recorre con el teclado', async () => {
    const user = userEvent.setup();
    renderSubNavigation('/pomodoro');
    expect(screen.getByRole('link', { name: 'Sesión' }).className).toContain('min-h-touch');

    await user.tab();
    expect(screen.getByRole('link', { name: 'Sesión' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Pantalla de historial')).toBeInTheDocument();
  });
});
