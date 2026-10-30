import { jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiOk, mockApi } from '../../../../../jest/mock-api';
import { AppUnderTest, freshStore, routerAt } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { APP_ROUTES } from '../../../../shared/router/router';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AccountPage', () => {
  it('RF-38 y RF-53: muestra email y fecha de alta, y el nombre guardado aparece en la navegación', async () => {
    const user = userEvent.setup();
    mockApi({
      'PATCH /me': () => apiOk({ ...USER, name: 'Ana' }),
      'GET /me': () => apiOk({ user: { ...USER, name: 'Ana' }, csrfToken: 'sesion-1' }),
    });
    const store = freshStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
    render(<AppUnderTest store={store} router={routerAt(APP_ROUTES, '/account')} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Cuenta' })).toBeInTheDocument();
    const profile = screen.getByRole('region', { name: 'Perfil' });
    expect(profile).toHaveTextContent('ana@example.com');
    expect(within(profile).getByText('jueves, 29 de octubre de 2026')).toHaveAttribute(
      'datetime',
      '2026-10-29T10:00:00.000Z',
    );
    // Sin nombre, la navegación muestra el email
    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(1);

    const name = within(profile).getByLabelText('Nombre (opcional)');
    expect(name).toHaveValue('');
    await user.type(name, 'Ana');
    await user.click(within(profile).getByRole('button', { name: 'Guardar nombre' }));
    expect(await within(profile).findByRole('status')).toHaveTextContent('Nombre guardado.');
    await waitFor(() => {
      expect(screen.getAllByText('ana@example.com')).toHaveLength(1);
    });
    expect(screen.getAllByText('Ana').length).toBeGreaterThan(0);
  });
});
