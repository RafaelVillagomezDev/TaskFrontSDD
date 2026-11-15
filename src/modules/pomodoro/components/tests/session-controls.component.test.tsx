import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { EndSound } from '../../hooks/use-end-sound.hook';
import type { SessionActions } from '../../hooks/use-session-actions.hook';
import type { Pomodoro } from '../../schemas/pomodoro.schema';
import { pomodoroFixture } from '../../tests/pomodoro.fixtures';
import { SessionControls } from '../session-controls.component';

function setup(session: Pomodoro, overrides: Partial<SessionActions> = {}, muted = false) {
  const actions = {
    isChangingStatus: false,
    pause: jest.fn(() => Promise.resolve()),
    resume: jest.fn(() => Promise.resolve()),
    requestFinish: jest.fn(),
    ...overrides,
  } as unknown as SessionActions;
  const sound = { muted, toggleMuted: jest.fn(), prime: jest.fn(), play: jest.fn() } satisfies EndSound;
  render(<SessionControls session={session} actions={actions} sound={sound} />);
  return { actions, sound };
}

describe('SessionControls', () => {
  it('RF-23: en curso ofrece «Pausar» y «Terminar»', async () => {
    const user = userEvent.setup();
    const { actions } = setup(pomodoroFixture());
    expect(screen.getByRole('group', { name: 'Controles de la sesión' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(actions.pause).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Reanudar' })).not.toBeInTheDocument();
  });

  it('RF-24: en pausa ofrece «Reanudar»', async () => {
    const user = userEvent.setup();
    const { actions } = setup(pomodoroFixture({ status: 'paused' }));
    await user.click(screen.getByRole('button', { name: 'Reanudar' }));
    expect(actions.resume).toHaveBeenCalled();
  });

  it('RF-25: «Terminar» pide terminar (la confirmación es aparte)', async () => {
    const user = userEvent.setup();
    const { actions } = setup(pomodoroFixture());
    await user.click(screen.getByRole('button', { name: 'Terminar' }));
    expect(actions.requestFinish).toHaveBeenCalled();
  });

  it('mientras cambia el estado no se puede pulsar otra vez', () => {
    setup(pomodoroFixture(), { isChangingStatus: true });
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeDisabled();
  });

  it('RF-61: el botón de silencio indica si está activo y lo cambia', async () => {
    const user = userEvent.setup();
    const { sound } = setup(pomodoroFixture(), {}, true);
    const mute = screen.getByRole('button', { name: 'Silenciar el aviso de fin' });
    expect(mute).toHaveAttribute('aria-pressed', 'true');
    await user.click(mute);
    expect(sound.toggleMuted).toHaveBeenCalled();
  });
});
