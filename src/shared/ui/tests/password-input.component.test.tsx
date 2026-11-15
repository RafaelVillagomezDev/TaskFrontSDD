import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PasswordInput } from '../password-input.component';
import { usePasswordVisibility } from '../use-password-visibility.hook';

describe('usePasswordVisibility', () => {
  it('empieza oculta y alterna', () => {
    const { result } = renderHook(() => usePasswordVisibility());
    expect(result.current.visible).toBe(false);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.visible).toBe(true);
  });
});

describe('S-11: PasswordInput', () => {
  it('empieza oculta y el botón la muestra y la vuelve a ocultar', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Contraseña" />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('el botón no envía el formulario y se puede usar con teclado', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Contraseña" />);
    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(toggle).toHaveAttribute('type', 'button');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');
  });

  it('el error se asocia al campo', () => {
    render(<PasswordInput label="Contraseña" errorText="La contraseña no es correcta." />);
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription('La contraseña no es correcta.');
  });
});
