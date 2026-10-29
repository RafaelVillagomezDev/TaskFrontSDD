import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { AppUnderTest, freshStore, routerAt } from '../../../../../jest/render-app';
import { APP_ROUTES } from '../../../../shared/router/router';
import { sessionEnded } from '../../store/auth.slice';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };
const csrf = () => apiOk({ csrfToken: 'previo-1' });

function renderRegister() {
  const store = freshStore();
  store.dispatch(sessionEnded());
  const router = routerAt(APP_ROUTES, '/register');
  render(<AppUnderTest store={store} router={router} />);
  return { router };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RegisterPage', () => {
  it('S-11: email, una sola contraseña con «mostrar» y nombre opcional', () => {
    renderRegister();
    expect(screen.getByRole('heading', { level: 1, name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Contraseña/)).toHaveLength(1);
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription('Entre 12 y 128 caracteres.');
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre (opcional)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
  });

  it('RF-01: crea la cuenta y lleva al inicio de sesión con el email escrito y el aviso', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiOk(USER, 201) });
    const { router } = renderRegister();
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Cuenta creada. Ya puedes iniciar sesión.');
    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
  });

  it('RF-03: email ya registrado → error bajo el email y el resto se conserva', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(409, 'EMAIL_ALREADY_REGISTERED') });
    renderRegister();
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'correct horse battery');
    await user.type(screen.getByLabelText('Nombre (opcional)'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Ya existe una cuenta con este email.');
    });
    expect(screen.getByLabelText('Contraseña')).toHaveValue('correct horse battery');
    expect(screen.getByLabelText('Nombre (opcional)')).toHaveValue('Ana');
  });

  it('RF-44: un fallo inesperado muestra una alerta', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(500, 'INTERNAL_ERROR') });
    renderRegister();
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'correct horse battery');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo ha fallado.');
  });
});
