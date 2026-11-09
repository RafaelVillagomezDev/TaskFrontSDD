import { render, screen } from '@testing-library/react';

import type { AchievementView } from '../../hooks/use-pomodoro-achievements.hook';
import { AchievementCard } from '../achievement-card.component';

function view(overrides: Partial<AchievementView> = {}): AchievementView {
  return {
    code: 'SESSIONS_10',
    name: 'Concentrado',
    description: '10 sesiones terminadas por tiempo.',
    progress: 3,
    target: 10,
    unlocked: false,
    progressLabel: '3 de 10',
    unlockedLabel: undefined,
    ...overrides,
  };
}

function renderCard(achievement: AchievementView) {
  return render(
    <ul>
      <AchievementCard achievement={achievement} />
    </ul>,
  );
}

describe('AchievementCard', () => {
  it('RF-42: muestra el nombre, la descripción y el progreso sobre la meta con una barra accesible', () => {
    renderCard(view());

    expect(screen.getByRole('heading', { name: 'Concentrado' })).toBeInTheDocument();
    expect(screen.getByText('10 sesiones terminadas por tiempo.')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Progreso de «Concentrado»' });
    expect(bar).toHaveAttribute('value', '3');
    expect(bar).toHaveAttribute('max', '10');
    expect(screen.getByText('3 de 10')).toBeInTheDocument();
    expect(screen.queryByText('Conseguido')).not.toBeInTheDocument();
  });

  it('RF-43: un logro conseguido lo indica con su fecha', () => {
    renderCard(
      view({ progress: 10, unlocked: true, progressLabel: '10 de 10', unlockedLabel: 'Conseguido el 9 nov 2026, 10:30' }),
    );

    expect(screen.getByText('Conseguido')).toBeInTheDocument();
    expect(screen.getByText('Conseguido el 9 nov 2026, 10:30')).toBeInTheDocument();
  });
});
