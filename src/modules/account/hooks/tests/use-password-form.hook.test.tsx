import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { usePasswordForm } from '../use-password-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };
const VALUES = { currentPassword: 'correct horse battery', newPassword: 'otra frase bastante larga' };

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  // Leer los errores al renderizar los suscribe, como hace PasswordForm
  const view = renderHook(
    () => {
      const passwordForm = usePasswordForm();
      return { passwordForm, errors: passwordForm.form.formState.errors };
    },
    { wrapper: appWrapper(store, '/account') },
  );
  return { ...view, store };
}

type View = ReturnType<typeof setup>['result'];

async function submit(result: View, values = VALUES) {
  act(() => {
    result.current.passwordForm.form.setValue('currentPassword', values.currentPassword);
    result.current.passwordForm.form.setValue('newPassword', values.newPassword);
  });
  await act(async () => {
    result.current.passwordForm.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePasswordForm', () => {
  it('RF-39: al cambiarla vacía los campos, mantiene la sesión y avisa de que las demás se han cerrado', async () => {
    const api = mockApi({ 'PATCH /me/password': () => apiOk(null) });
    const { result, store } = setup();
    await submit(result);
    await waitFor(() => {
      expect(result.current.passwordForm.notice).toBe(
        'Contraseña cambiada. Has cerrado sesión en tus otros dispositivos; aquí sigues dentro.',
      );
    });
    expect(await api.bodyOf('PATCH /me/password')).toEqual(VALUES);
    expect(result.current.passwordForm.form.getValues()).toEqual({ currentPassword: '', newPassword: '' });
    expect(store.getState().auth.status).toBe('authenticated');
    act(() => {
      result.current.passwordForm.dismissNotice();
    });
    expect(result.current.passwordForm.notice).toBeUndefined();
  });

  it('RF-48: con la contraseña actual incorrecta marca ese campo y conserva lo escrito', async () => {
    mockApi({ 'PATCH /me/password': () => apiFail(403, 'WRONG_PASSWORD') });
    const { result } = setup();
    await submit(result);
    await waitFor(() => {
      expect(result.current.errors.currentPassword?.message).toBe('La contraseña no es correcta.');
    });
    expect(result.current.passwordForm.form.getValues()).toEqual(VALUES);
    expect(result.current.passwordForm.notice).toBeUndefined();
  });

  it('RF-05: TOO_MANY_ATTEMPTS da el mensaje de bloqueo', async () => {
    mockApi({ 'PATCH /me/password': () => apiFail(429, 'TOO_MANY_ATTEMPTS') });
    const { result } = setup();
    await submit(result);
    await waitFor(() => {
      expect(result.current.passwordForm.formError).toBe(
        'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.',
      );
    });
  });

  it('RF-41: la nueva rechazada por la API muestra el mensaje del cliente en su campo', async () => {
    mockApi({
      'PATCH /me/password': () => apiFail(400, 'VALIDATION_ERROR', [{ field: 'newPassword', message: 'x' }]),
    });
    const { result } = setup();
    await submit(result);
    await waitFor(() => {
      expect(result.current.errors.newPassword?.message).toBe('Revisa este campo.');
    });
  });

  it('RF-02: con campos no válidos no envía nada', async () => {
    const api = mockApi({});
    const { result } = setup();
    await submit(result, { currentPassword: '', newPassword: 'corta' });
    await waitFor(() => {
      expect(result.current.errors.currentPassword?.message).toBe('Escribe tu contraseña actual.');
    });
    expect(result.current.errors.newPassword?.message).toBe('La contraseña debe tener al menos 12 caracteres.');
    expect(api.requests).toHaveLength(0);
  });
});
