import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmPomodoroDialog, type ConfirmVariant } from '../confirm-pomodoro-dialog.component';

function renderDialog(variant: ConfirmVariant, subject?: string) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  render(
    <ConfirmPomodoroDialog
      variant={variant}
      open
      busy={false}
      subject={subject}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmPomodoroDialog', () => {
  it('RF-26: terminar la sesión explica qué pasa con las pendientes y empieza con el foco en «Cancelar»', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog('finish');
    const dialog = screen.getByRole('dialog', { name: '¿Terminar la sesión?' });
    expect(dialog).toHaveTextContent('pasarán a tus tareas en espera');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Terminar sesión' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('RF-26: Escape cierra sin terminar', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = renderDialog('finish');
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('RF-33: borrar una tarea en espera nombra la tarea y avisa de que no se puede deshacer', () => {
    renderDialog('deleteTask', 'Llamar a Marta');
    const dialog = screen.getByRole('dialog', { name: '¿Borrar la tarea?' });
    expect(dialog).toHaveTextContent('Se borrará «Llamar a Marta» de tus tareas en espera. No se puede deshacer.');
    expect(screen.getByRole('button', { name: 'Borrar tarea' })).toBeInTheDocument();
  });
});
