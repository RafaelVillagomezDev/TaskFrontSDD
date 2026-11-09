import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { formatDateTime } from '@shared/date/date-format.util';
import type { Pomodoro } from '../../schemas/pomodoro.schema';
import { pomodoroFixture, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { SessionHistoryItem } from '../session-history-item.component';

function renderItem(session: Pomodoro) {
  return render(
    <MemoryRouter>
      <ul>
        <SessionHistoryItem session={session} />
      </ul>
    </MemoryRouter>,
  );
}

const FINISHED = pomodoroFixture({
  id: 'p-9',
  status: 'finished',
  durationMinutes: 45,
  focusedSeconds: 1800,
  endReason: 'manual',
  tasks: [pomodoroTaskFixture({ id: 'a', completed: true }), pomodoroTaskFixture({ id: 'b' })],
});

describe('SessionHistoryItem', () => {
  it('RF-39: muestra la fecha, la duración, la concentración, el motivo de fin y «X de Y»', () => {
    renderItem(FINISHED);

    expect(screen.getByText(formatDateTime(FINISHED.startedAt))).toBeInTheDocument();
    expect(screen.getByText('Sesión de 45 min')).toBeInTheDocument();
    expect(screen.getByText('Terminada a mano · 30 min de concentración')).toBeInTheDocument();
    expect(screen.getByText('1 de 2 tareas hechas')).toBeInTheDocument();
  });

  it('RF-39: una sesión terminada por tiempo lo indica', () => {
    renderItem(pomodoroFixture({ status: 'finished', focusedSeconds: 3900 }));
    expect(screen.getByText('Terminada por tiempo · 1 h 5 min de concentración')).toBeInTheDocument();
  });

  it('RF-40 y RF-54: enlaza con el detalle de la sesión', () => {
    renderItem(FINISHED);
    expect(screen.getByRole('link', { name: `Ver la sesión del ${formatDateTime(FINISHED.startedAt)}` })).toHaveAttribute(
      'href',
      '/pomodoro/history/p-9',
    );
  });

  it.each([
    ['running', 'En curso'],
    ['paused', 'En pausa'],
  ] as const)('una sesión %s se marca como «%s» y lleva a la sesión activa', (status, label) => {
    const session = pomodoroFixture({ status });
    renderItem(session);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText(/de concentración/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: `Ver la sesión del ${formatDateTime(session.startedAt)}` })).toHaveAttribute(
      'href',
      '/pomodoro',
    );
  });
});
