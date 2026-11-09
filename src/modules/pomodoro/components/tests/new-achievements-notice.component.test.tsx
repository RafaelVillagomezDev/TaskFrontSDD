import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import type { Achievement } from '../../schemas/pomodoro.schema';
import { achievementFixture } from '../../tests/pomodoro.fixtures';
import { NewAchievementsNotice } from '../new-achievements-notice.component';

function renderNotice(achievements: Achievement[]) {
  return render(
    <MemoryRouter>
      <NewAchievementsNotice achievements={achievements} />
    </MemoryRouter>,
  );
}

describe('NewAchievementsNotice', () => {
  it('RF-68: avisa de un logro nuevo con acceso a «Logros»', () => {
    renderNotice([achievementFixture({ name: 'Primer pomodoro' })]);

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('¡Logro conseguido!');
    expect(within(notice).getByText('Primer pomodoro')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis logros' })).toHaveAttribute('href', '/pomodoro/achievements');
  });

  it('RF-68: con varios logros nuevos los lista todos', () => {
    renderNotice([
      achievementFixture({ code: 'FIRST_POMODORO', name: 'Primer pomodoro' }),
      achievementFixture({ code: 'TASKS_10', name: 'Cumplidor' }),
    ]);

    expect(screen.getByRole('status')).toHaveTextContent('¡Logros conseguidos!');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Primer pomodoro', 'Cumplidor']);
  });

  it('RF-69: sin logros nuevos no muestra nada', () => {
    const { container } = renderNotice([]);
    expect(container).toBeEmptyDOMElement();
  });
});
