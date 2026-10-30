import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { mockApi } from '../../../../../jest/mock-api';
import { freshStore } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { useProfileForm } from '../../hooks/use-profile-form.hook';
import { ProfileForm } from '../profile-form.component';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function Harness() {
  return <ProfileForm profile={useProfileForm()} />;
}

function renderForm() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
  return screen.getByRole('region', { name: 'Perfil' });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ProfileForm', () => {
  it('RF-38: email y fecha de alta de solo lectura; el nombre es el único campo', () => {
    const profile = renderForm();
    expect(within(profile).getByText('Email').nextElementSibling).toHaveTextContent('ana@example.com');
    expect(within(profile).getByText('Fecha de alta').nextElementSibling).toHaveTextContent(
      'jueves, 29 de octubre de 2026',
    );
    expect(within(profile).getAllByRole('textbox')).toHaveLength(1);
    expect(within(profile).getByLabelText('Nombre (opcional)')).toHaveValue('Ana');
    expect(within(profile).getByLabelText('Nombre (opcional)')).toHaveAccessibleDescription(
      'Se muestra en la navegación en lugar de tu email.',
    );
  });

  it('RF-02: el error del nombre va bajo el campo y no se envía nada', async () => {
    const api = mockApi({});
    const user = userEvent.setup();
    const profile = renderForm();
    const name = within(profile).getByLabelText('Nombre (opcional)');
    await user.clear(name);
    await user.type(name, 'n'.repeat(101));
    await user.click(within(profile).getByRole('button', { name: 'Guardar nombre' }));
    expect(await within(profile).findByText('El nombre no puede tener más de 100 caracteres.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(api.requests).toHaveLength(0);
  });
});
