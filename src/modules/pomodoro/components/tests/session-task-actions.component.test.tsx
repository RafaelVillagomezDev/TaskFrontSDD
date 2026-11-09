import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { SessionTaskActions } from '../session-task-actions.component';

describe('SessionTaskActions', () => {
  it('RF-30: una tarea pendiente se puede quitar de la sesión', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    const task = pomodoroTaskFixture();
    render(<SessionTaskActions task={task} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: 'Quitar «Repasar el tema 3» de la sesión' }));
    expect(onRemove).toHaveBeenCalledWith(task);
  });

  it('RF-31: una tarea completada no ofrece quitarla', () => {
    render(<SessionTaskActions task={pomodoroTaskFixture({ completed: true })} onRemove={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument();
  });

  it('muestra las demás acciones que se le pasan', () => {
    render(
      <SessionTaskActions task={pomodoroTaskFixture()} onRemove={jest.fn()}>
        <button type="button">Editar</button>
      </SessionTaskActions>,
    );
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });
});
