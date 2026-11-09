import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { focusDuration } from '../../texts/pomodoro.texts';
import { pomodoroFixture, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { SessionResult } from '../session-result.component';

describe('SessionResult', () => {
  it('RF-27 y RF-28: resumen, concentración, motivo y tareas completadas y pendientes', () => {
    const session = pomodoroFixture({
      status: 'finished',
      endReason: 'manual',
      focusedSeconds: 600,
      tasks: [
        pomodoroTaskFixture({ id: 'a', title: 'Hecha', completed: true }),
        pomodoroTaskFixture({ id: 'b', title: 'Sin hacer' }),
      ],
    });
    render(<SessionResult session={session} onStartAnother={jest.fn()} />);

    const region = screen.getByRole('region', { name: 'Resultado de la sesión' });
    expect(within(region).getByRole('heading', { name: 'Sesión terminada' })).toBeInTheDocument();
    expect(region).toHaveTextContent('Terminada a mano · 10 min de concentración');
    expect(region).toHaveTextContent('1 de 2 tareas hechas');
    expect(within(screen.getByRole('list', { name: 'Completadas' })).getByText('Hecha')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Pendientes' })).getByText('Sin hacer')).toBeInTheDocument();
    expect(region).toHaveTextContent('Han pasado a tus tareas en espera');
  });

  it('RF-27: una sesión terminada por tiempo y sin pendientes no muestra esa lista', () => {
    const session = pomodoroFixture({ status: 'finished', tasks: [pomodoroTaskFixture({ completed: true })] });
    render(<SessionResult session={session} onStartAnother={jest.fn()} />);
    expect(screen.getByText(/Terminada por tiempo/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Pendientes' })).not.toBeInTheDocument();
  });

  it('RF-71: «Empezar otra sesión» lo pide, también mientras se carga el resultado', async () => {
    const user = userEvent.setup();
    const onStartAnother = jest.fn();
    render(<SessionResult session={undefined} onStartAnother={onStartAnother} />);
    expect(screen.getByRole('status', { name: 'Cargando el resultado…' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Empezar otra sesión' }));
    expect(onStartAnother).toHaveBeenCalled();
  });
});

describe('focusDuration', () => {
  it.each([
    [0, '0 min'],
    [1499, '24 min'],
    [3900, '1 h 5 min'],
  ])('%i s → %s', (seconds, text) => {
    expect(focusDuration(seconds)).toBe(text);
  });
});
