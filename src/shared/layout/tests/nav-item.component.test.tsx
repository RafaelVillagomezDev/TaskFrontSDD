import { render, screen } from '@testing-library/react';
import { Timer } from 'lucide-react';
import { MemoryRouter } from 'react-router';

import { NavItem } from '../nav-item.component';

function renderItem(path: string, matchSubroutes = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NavItem to="/pomodoro" icon={Timer} matchSubroutes={matchSubroutes}>
        Pomodoro
      </NavItem>
    </MemoryRouter>,
  );
}

describe('NavItem', () => {
  it('RF-54 (001): sin matchSubroutes solo se marca activo en su ruta exacta', () => {
    renderItem('/pomodoro/history');
    expect(screen.getByRole('link', { name: 'Pomodoro' })).not.toHaveAttribute('aria-current');
  });

  it.each(['/pomodoro', '/pomodoro/history', '/pomodoro/history/p-1', '/pomodoro/achievements'])(
    'RF-02 (003): con matchSubroutes se marca activo también en %s',
    (path) => {
      renderItem(path, true);
      expect(screen.getByRole('link', { name: 'Pomodoro' })).toHaveAttribute('aria-current', 'page');
    },
  );

  it('RF-02 (003): con matchSubroutes no se marca activo en una ruta que solo empieza igual', () => {
    renderItem('/pomodoro-x', true);
    expect(screen.getByRole('link', { name: 'Pomodoro' })).not.toHaveAttribute('aria-current');
  });
});
