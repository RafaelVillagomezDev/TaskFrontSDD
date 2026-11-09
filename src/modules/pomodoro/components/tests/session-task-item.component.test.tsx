import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PomodoroTask } from '../../schemas/pomodoro.schema';
import { pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { SessionTaskItem } from '../session-task-item.component';

function renderItem(task: PomodoroTask, saving = false) {
  const onToggle = jest.fn();
  render(
    <ul>
      <SessionTaskItem task={task} saving={saving} onToggle={onToggle}>
        <button type="button">Editar</button>
      </SessionTaskItem>
    </ul>,
  );
  return onToggle;
}

describe('SessionTaskItem', () => {
  it('RF-22: la casilla completa la tarea, también con el teclado', async () => {
    const user = userEvent.setup();
    const task = pomodoroTaskFixture({ description: 'Del libro' });
    const onToggle = renderItem(task);
    expect(screen.getByText('Del libro')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Completar «Repasar el tema 3»' }));
    expect(onToggle).toHaveBeenCalledWith(task);

    screen.getByRole('checkbox').focus();
    await user.keyboard(' ');
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('RF-22: una tarea completada aparece marcada y tachada', () => {
    renderItem(pomodoroTaskFixture({ completed: true }));
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByText('Repasar el tema 3').className).toContain('line-through');
  });

  it('plan D-2: mientras se guarda, la casilla no envía otro cambio', async () => {
    const user = userEvent.setup();
    const onToggle = renderItem(pomodoroTaskFixture(), true);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    await user.click(checkbox);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('muestra las acciones que se le pasan', () => {
    renderItem(pomodoroTaskFixture());
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });
});
