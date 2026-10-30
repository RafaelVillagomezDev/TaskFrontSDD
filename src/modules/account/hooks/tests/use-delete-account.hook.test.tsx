import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '../../../../../jest/render-app';
import { tasksApi } from '../../../tasks';
import { sessionStarted } from '../../../auth';
import { useDeleteAccount } from '../use-delete-account.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  const view = renderHook(
    () => {
      const deletion = useDeleteAccount();
      return { deletion, errors: deletion.form.formState.errors, router: useRouterProbe() };
    },
    { wrapper: appWrapper(store, '/account') },
  );
  return { ...view, store };
}

type View = ReturnType<typeof setup>['result'];

async function confirmWith(result: View, password: string) {
  act(() => {
    result.current.deletion.onOpenChange(true);
  });
  act(() => {
    result.current.deletion.form.setValue('password', password);
  });
  await act(async () => {
    result.current.deletion.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useDeleteAccount', () => {
  it('RF-49: con la contraseña correcta borra la cuenta, vacía sesión y caché y va a /login reemplazando', async () => {
    const api = mockApi({
      'DELETE /me': () => apiOk(null),
      'GET /tasks': () => apiOk({ items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0 }),
    });
    const { result, store } = setup();
    await store.dispatch(tasksApi.endpoints.getWeekTasks.initiate('2026-10-29', { subscribe: false }));
    await confirmWith(result, 'correct horse battery');
    await waitFor(() => {
      expect(result.current.router.location.pathname).toBe('/login');
    });
    expect(result.current.router.navigationType).toBe('REPLACE');
    expect(await api.bodyOf('DELETE /me')).toEqual({ password: 'correct horse battery' });
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.csrfToken).toBeNull();
    expect(store.getState().api.queries).toEqual({});
  });

  it('RF-49: sin contraseña no se puede confirmar ni se llama a la API', async () => {
    const api = mockApi({});
    const { result } = setup();
    await confirmWith(result, '');
    await waitFor(() => {
      expect(result.current.errors.password?.message).toBe('Escribe tu contraseña para borrar la cuenta.');
    });
    expect(api.requests).toHaveLength(0);
    expect(result.current.deletion.isOpen).toBe(true);
  });

  it('RF-48: con la contraseña incorrecta marca el campo y no cambia nada', async () => {
    mockApi({ 'DELETE /me': () => apiFail(403, 'WRONG_PASSWORD') });
    const { result, store } = setup();
    await confirmWith(result, 'mal');
    await waitFor(() => {
      expect(result.current.errors.password?.message).toBe('La contraseña no es correcta.');
    });
    expect(store.getState().auth.user).toEqual(USER);
    expect(result.current.router.location.pathname).toBe('/account');
  });

  it('RF-05: TOO_MANY_ATTEMPTS da el mensaje de bloqueo', async () => {
    mockApi({ 'DELETE /me': () => apiFail(429, 'TOO_MANY_ATTEMPTS') });
    const { result } = setup();
    await confirmWith(result, 'correct horse battery');
    await waitFor(() => {
      expect(result.current.deletion.formError).toBe(
        'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.',
      );
    });
  });

  it('al volver a abrir el diálogo empieza sin contraseña y se puede cerrar', () => {
    const { result } = setup();
    act(() => {
      result.current.deletion.onOpenChange(true);
      result.current.deletion.form.setValue('password', 'algo');
    });
    act(() => {
      result.current.deletion.onOpenChange(false);
    });
    expect(result.current.deletion.isOpen).toBe(false);
    act(() => {
      result.current.deletion.onOpenChange(true);
    });
    expect(result.current.deletion.form.getValues('password')).toBe('');
  });
});
