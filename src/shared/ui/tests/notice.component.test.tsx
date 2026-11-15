import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Notice } from '../notice.component';

describe('Notice', () => {
  it('anuncia su contenido como estado y, sin onDismiss, no ofrece cerrarlo', () => {
    render(<Notice>Cuenta creada.</Notice>);
    expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada.');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('con onDismiss ofrece un botón con nombre accesible, fuera del texto anunciado', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    render(<Notice onDismiss={onDismiss}>Tarea creada.</Notice>);
    const dismiss = screen.getByRole('button', { name: 'Cerrar aviso' });
    expect(screen.getByRole('status')).not.toContainElement(dismiss);
    expect(dismiss.className).toContain('min-h-touch');
    await user.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
