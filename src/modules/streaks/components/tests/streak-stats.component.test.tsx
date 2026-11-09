import { render, screen } from '@testing-library/react';

import type { Streak } from '../../schemas/streak.schema';
import { StreakStats } from '../streak-stats.component';

// Las dos parejas dt/dd van dentro del <dl> de quien las usa
function renderStats(streak: Streak | undefined) {
  return render(
    <dl>
      <StreakStats streak={streak} />
    </dl>,
  );
}

function valueOf(label: string) {
  return screen.getByText(label).closest('div')?.querySelector('dd')?.textContent;
}

describe('StreakStats', () => {
  it('003 RF-41: muestra la racha actual y la mejor a partir de { current, best }', () => {
    renderStats({ current: 3, best: 7 });
    expect(valueOf('Racha actual')).toBe('3 días');
    expect(valueOf('Mejor racha')).toBe('7 días');
  });

  it('003 RF-41: racha 0 y en singular', () => {
    renderStats({ current: 0, best: 1 });
    expect(valueOf('Racha actual')).toBe('0 días');
    expect(valueOf('Mejor racha')).toBe('1 día');
  });

  it('mientras carga, cada dato muestra su indicador', () => {
    renderStats(undefined);
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });
});
