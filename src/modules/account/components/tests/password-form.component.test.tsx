import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { freshStore } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { usePasswordForm } from '../../hooks/use-password-form.hook';
import { PasswordForm } from '../password-form.component';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };

function Harness() {
  return <PasswordForm passwordForm={usePasswordForm()} />;
}

function renderForm() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
  const section = screen.getByRole('region', { name: 'Cambiar contraseña' });
  return {
    user: userEvent.setup(),
    section,
    current: within(section).getByLabelText('Contraseña actual'),
    next: within(section).getByLabelText('Contraseña nueva'),
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PasswordForm', () => {
  it('S-11 y RF-46: dos contraseñas ocultas, con la opción de mostrarlas, y la ayuda de la nueva', () => {
    const { section, current, next } = renderForm();
    expect(current).toHaveAttribute('type', 'password');
    expect(current).toHaveAttribute('autocomplete', 'current-password');
    expect(next).toHaveAttribute('autocomplete', 'new-password');
    expect(next).toHaveAccessibleDescription('Entre 12 y 128 caracteres.');
    expect(within(section).getAllByRole('button', { name: 'Mostrar contraseña' })).toHaveLength(2);
  });

  it('RF-39: al cambiarla avisa y vacía los campos', async () => {
    mockApi({ 'PATCH /me/password': () => apiOk(null) });
    const { user, section, current, next } = renderForm();
    await user.type(current, 'correct horse battery');
    await user.type(next, 'otra frase bastante larga');
    await user.click(within(section).getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await within(section).findByRole('status')).toHaveTextContent('Contraseña cambiada.');
    expect(current).toHaveValue('');
    expect(next).toHaveValue('');
  });

  it('RF-48: la contraseña actual incorrecta se marca en su campo', async () => {
    mockApi({ 'PATCH /me/password': () => apiFail(403, 'WRONG_PASSWORD') });
    const { user, section, current, next } = renderForm();
    await user.type(current, 'mal');
    await user.type(next, 'otra frase bastante larga');
    await user.click(within(section).getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await within(section).findByText('La contraseña no es correcta.')).toBeInTheDocument();
    expect(current).toHaveAttribute('aria-invalid', 'true');
    expect(next).not.toHaveAttribute('aria-invalid');
  });
});
