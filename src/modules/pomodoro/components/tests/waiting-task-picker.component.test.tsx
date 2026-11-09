import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { addDays, todayKey } from '@shared/date/day.util';
import type { WaitingItem } from '../../hooks/use-waiting-tasks.hook';
import { pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { renderWithStartForm } from '../../tests/start-form.harness';
import { WaitingTaskPicker } from '../waiting-task-picker.component';

function items(count: number): WaitingItem[] {
  return Array.from({ length: count }, (_, index) => ({
    task: pomodoroTaskFixture({ id: `w-${String(index)}`, title: `En espera ${String(index + 1)}` }),
    takesToday: false,
  }));
}

describe('WaitingTaskPicker', () => {
  it('sin tareas en espera no se muestra', () => {
    renderWithStartForm((startForm) => <WaitingTaskPicker items={[]} rows={startForm.rows} />);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('RF-12: elegir una tarea en espera la incluye en el formulario', async () => {
    const user = userEvent.setup();
    let selected: string[] = [];
    renderWithStartForm((startForm) => {
      selected = startForm.form.getValues('waitingTaskIds');
      return <WaitingTaskPicker items={items(2)} rows={startForm.rows} />;
    });
    expect(screen.getByRole('group', { name: 'Incluir tareas en espera' })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /En espera 2/ }));

    expect(screen.getByRole('checkbox', { name: /En espera 2/ })).toBeChecked();
    expect(selected).toEqual(['w-1']);
  });

  it('RF-37: una tarea con fecha pasada avisa de que tomará la de hoy', () => {
    const past: WaitingItem = { task: pomodoroTaskFixture({ date: addDays(todayKey(), -3) }), takesToday: true };
    renderWithStartForm((startForm) => <WaitingTaskPicker items={[past]} rows={startForm.rows} />);
    expect(screen.getByText('Tomará la fecha de hoy')).toBeInTheDocument();
  });

  it('RF-13: con 20 tareas entre nuevas y elegidas no deja elegir más', async () => {
    const user = userEvent.setup();
    renderWithStartForm((startForm) => (
      <>
        <button type="button" onClick={startForm.rows.add}>
          Fila
        </button>
        <WaitingTaskPicker items={items(2)} rows={startForm.rows} />
      </>
    ));
    for (let index = 0; index < 19; index += 1) await user.click(screen.getByRole('button', { name: 'Fila' }));
    await user.click(screen.getByRole('checkbox', { name: /En espera 1/ }));

    expect(screen.getByRole('checkbox', { name: /En espera 2/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /En espera 1/ })).toBeEnabled();
  });
});
