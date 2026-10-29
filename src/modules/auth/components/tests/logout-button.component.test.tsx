import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiOk, mockApi } from '../../../../../jest/mock-api';
import { AppUnderTest, freshStore, routerAt } from '../../../../../jest/render-app';
import { APP_ROUTES } from '../../../../shared/router/router';
import { sessionStarted } from '../../store/auth.slice';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

afterEach(() => {
  jest.restoreAllMocks();
});

describe('RF-50: LogoutButton en la navegación', () => {
  it('cierra la sesión y lleva al inicio de sesión sin returnTo', async () => {
    const user = userEvent.setup();
    mockApi({ 'POST /auth/logout': () => apiOk(null) });
    const store = freshStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
    const router = routerAt(APP_ROUTES, '/history');
    render(<AppUnderTest store={store} router={router} />);

    const [sidebarButton] = screen.getAllByRole('button', { name: 'Cerrar sesión' });
    if (sidebarButton === undefined) throw new Error('Falta el botón de cerrar sesión');
    await user.click(sidebarButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('');
    expect(store.getState().auth.status).toBe('anonymous');
  });
});
