import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { todayKey } from '@shared/date/day.util';
import { renderWithStartForm } from '../../tests/start-form.harness';
import { NewTaskFields } from '../new-task-fields.component';

function renderFields() {
  return renderWithStartForm((startForm) => <NewTaskFields rows={startForm.rows} />);
}

describe('NewTaskFields', () => {
  it('RF-10: «Añadir tarea» crea una fila numerada con título, descripción y la fecha de hoy', async () => {
    const user = userEvent.setup();
    renderFields();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Añadir tarea' }));

    const row = screen.getByRole('group', { name: 'Tarea 1' });
    expect(within(row).getByLabelText('Título')).toHaveValue('');
    expect(within(row).getByLabelText('Descripción (opcional)')).toBeInTheDocument();
    const date = within(row).getByLabelText('Fecha');
    expect(date).toHaveValue(todayKey());
    expect(date).toHaveAttribute('min', todayKey());
  });

  it('quita la fila elegida y renumera las demás', async () => {
    const user = userEvent.setup();
    renderFields();
    await user.click(screen.getByRole('button', { name: 'Añadir tarea' }));
    await user.click(screen.getByRole('button', { name: 'Añadir tarea' }));
    await user.type(within(screen.getByRole('group', { name: 'Tarea 2' })).getByLabelText('Título'), 'Segunda');

    await user.click(screen.getByRole('button', { name: 'Quitar la tarea 1' }));

    expect(screen.getAllByRole('group')).toHaveLength(1);
    expect(within(screen.getByRole('group', { name: 'Tarea 1' })).getByLabelText('Título')).toHaveValue('Segunda');
  });

  it('RF-13: con 20 tareas no ofrece añadir otra y explica por qué', async () => {
    const user = userEvent.setup();
    renderFields();
    for (let index = 0; index < 20; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Añadir tarea' }));
    }
    expect(screen.queryByRole('button', { name: 'Añadir tarea' })).not.toBeInTheDocument();
    expect(screen.getByText('Has llegado al máximo de 20 tareas por sesión.')).toBeInTheDocument();
  });
});
