import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { PomodoroLayout } from '../pomodoro.layout';

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PomodoroLayout />}>
          <Route path="/pomodoro" element={<p>Vista de sesión</p>} />
          <Route path="/pomodoro/history/:id" element={<p>Vista de detalle</p>} />
          <Route path="/pomodoro/achievements" element={<p>Vista de logros</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('PomodoroLayout', () => {
  it('RF-51: muestra el título, la subnavegación con «Sesión» activa y la vista de la ruta', () => {
    renderLayout('/pomodoro');
    expect(screen.getByRole('heading', { level: 1, name: 'Pomodoro' })).toBeInTheDocument();
    const subNavigation = screen.getByRole('navigation', { name: 'Secciones del pomodoro' });
    expect(subNavigation).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sesión' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Vista de sesión')).toBeInTheDocument();
  });

  it('RF-51 y RF-54: «Historial» lleva al historial y sigue activo en el detalle de una sesión', () => {
    renderLayout('/pomodoro/history/p-1');
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('href', '/pomodoro/history');
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Sesión' })).not.toHaveAttribute('aria-current');
  });

  it('RF-51 y RF-53: la subnavegación tiene «Sesión», «Historial» y «Logros», y marca «Logros» en su vista', () => {
    renderLayout('/pomodoro/achievements');
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Sesión', 'Historial', 'Logros']);
    expect(screen.getByRole('link', { name: 'Logros' })).toHaveAttribute('href', '/pomodoro/achievements');
    expect(screen.getByRole('link', { name: 'Logros' })).toHaveAttribute('aria-current', 'page');
  });

  it('RF-51: es el contenido principal de la pantalla', () => {
    renderLayout('/pomodoro');
    expect(screen.getByRole('main')).toContainElement(screen.getByText('Vista de sesión'));
  });
});
