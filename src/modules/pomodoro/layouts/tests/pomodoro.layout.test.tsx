import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { PomodoroLayout } from '../pomodoro.layout';

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<PomodoroLayout />}>
          <Route path="/pomodoro" element={<p>Vista de sesión</p>} />
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

  it('RF-51: es el contenido principal de la pantalla', () => {
    renderLayout('/pomodoro');
    expect(screen.getByRole('main')).toContainElement(screen.getByText('Vista de sesión'));
  });
});
