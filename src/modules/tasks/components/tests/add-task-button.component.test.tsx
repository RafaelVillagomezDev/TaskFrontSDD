import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddTaskButton } from '../add-task-button.component';

describe('AddTaskButton', () => {
  it('RF-15: su nombre incluye el día y al pulsarlo avisa con esa fecha', async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    render(<AddTaskButton day="2026-10-30" onAdd={onAdd} />);
    const button = screen.getByRole('button', { name: 'Añadir tarea el viernes, 30 de octubre de 2026' });
    expect(button).toHaveTextContent('Añadir tarea');
    expect(button.className).toContain('border-dashed');
    await user.click(button);
    expect(onAdd).toHaveBeenCalledWith('2026-10-30');
  });
});
