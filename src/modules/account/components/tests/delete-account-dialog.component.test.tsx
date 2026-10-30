import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import { apiFail, mockApi } from '../../../../../jest/mock-api';
import { freshStore } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { useDeleteAccount } from '../../hooks/use-delete-account.hook';
import { DeleteAccountDialog } from '../delete-account-dialog.component';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };
const WARNING = 'Se eliminarán para siempre tu cuenta, todas tus tareas y todos tus avisos. No se puede deshacer.';

function Harness() {
  return <DeleteAccountDialog deletion={useDeleteAccount()} />;
}

async function openDialog() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/account']}>
        <Harness />
      </MemoryRouter>
    </Provider>,
  );
  const user = userEvent.setup();
  const section = screen.getByRole('region', { name: 'Borrar cuenta' });
  expect(section).toHaveTextContent(WARNING);
  await user.click(within(section).getByRole('button', { name: 'Borrar mi cuenta' }));
  return { user, dialog: screen.getByRole('dialog', { name: '¿Borrar tu cuenta?' }) };
}

afterEach(() => {
  document.body.style.overflow = '';
  jest.restoreAllMocks();
});

describe('DeleteAccountDialog', () => {
  it('RF-49: avisa de lo que se elimina y pide la contraseña', async () => {
    const { dialog } = await openDialog();
    expect(dialog).toHaveTextContent(WARNING);
    expect(within(dialog).getByLabelText('Escribe tu contraseña para confirmar')).toHaveAttribute('type', 'password');
    expect(within(dialog).getByRole('button', { name: 'Borrar cuenta' })).toBeInTheDocument();
  });

  it('RF-49: sin contraseña no confirma y lo explica bajo el campo', async () => {
    const api = mockApi({});
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Borrar cuenta' }));
    expect(await within(dialog).findByText('Escribe tu contraseña para borrar la cuenta.')).toBeInTheDocument();
    expect(api.requests).toHaveLength(0);
  });

  it('RF-48: la contraseña incorrecta se marca en el campo y el diálogo sigue abierto', async () => {
    mockApi({ 'DELETE /me': () => apiFail(403, 'WRONG_PASSWORD') });
    const { user, dialog } = await openDialog();
    const password = within(dialog).getByLabelText('Escribe tu contraseña para confirmar');
    await user.type(password, 'mal');
    await user.click(within(dialog).getByRole('button', { name: 'Borrar cuenta' }));
    expect(await within(dialog).findByText('La contraseña no es correcta.')).toBeInTheDocument();
    expect(password).toHaveAttribute('aria-invalid', 'true');
  });

  it('«Cancelar» cierra sin borrar nada', async () => {
    const api = mockApi({});
    const { user, dialog } = await openDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.requests).toHaveLength(0);
  });
});
