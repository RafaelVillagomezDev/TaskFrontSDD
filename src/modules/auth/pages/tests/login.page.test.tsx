import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { AppUnderTest, freshStore, routerAt } from '../../../../../jest/render-app';
import { APP_ROUTES } from '../../../../shared/router/router';
import { sessionEnded } from '../../store/auth.slice';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const csrf = () => apiOk({ csrfToken: 'previo-1' });

function renderLogin(path: Parameters<typeof routerAt>[1] = '/login') {
  const store = freshStore();
  store.dispatch(sessionEnded());
  const router = routerAt(APP_ROUTES, path);
  render(<AppUnderTest store={store} router={router} />);
  return { store, router };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('LoginPage', () => {
  it('muestra el formulario con etiquetas y el enlace al registro', () => {
    renderLogin();
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute('href', '/register');
  });

  it('RF-02: muestra los errores bajo cada campo sin llamar a la API', async () => {
    const user = userEvent.setup();
    const api = mockApi({});
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Escribe tu email.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Escribe tu email.');
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription('Escribe tu contraseña.');
    expect(api.requests).toHaveLength(0);
  });

  it('RF-07: tras entrar vuelve a la pantalla de returnTo, solo con teclado', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiOk({ user: USER, csrfToken: 's' }) });
    const { router } = renderLogin('/login?returnTo=%2Fhistory&reason=expired');
    expect(screen.getByRole('status')).toHaveTextContent('Tu sesión ha caducado. Inicia sesión de nuevo.');
    await user.tab();
    await user.keyboard('ana@example.com');
    await user.tab();
    await user.keyboard('correct horse battery{Enter}');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/history');
    });
  });

  it('RF-04: credenciales incorrectas → alerta con el mensaje genérico', async () => {
    const user = userEvent.setup();
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(401, 'INVALID_CREDENTIALS') });
    renderLogin();
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El email o la contraseña no son correctos.');
  });

  it('RF-01: tras registrarse, el email ya escrito y el aviso de cuenta creada', () => {
    renderLogin({ pathname: '/login', state: { registered: true, email: 'ana@example.com' } });
    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
    expect(screen.getByRole('status')).toHaveTextContent('Cuenta creada. Ya puedes iniciar sesión.');
  });
});
