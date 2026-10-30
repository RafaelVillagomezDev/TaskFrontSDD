import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { selectUserDisplayName, sessionStarted, type User } from '../../../auth';
import { useProfileForm } from '../use-profile-form.hook';

const USER: User = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };

function setup(user = USER) {
  const store = freshStore();
  store.dispatch(sessionStarted({ user, csrfToken: 'sesion-1' }));
  // Leer los errores al renderizar los suscribe, como hace ProfileForm
  const view = renderHook(
    () => {
      const profile = useProfileForm();
      return { profile, errors: profile.form.formState.errors };
    },
    { wrapper: appWrapper(store, '/account') },
  );
  return { ...view, store };
}

type View = ReturnType<typeof setup>['result'];

async function save(result: View, name: string) {
  act(() => {
    result.current.profile.form.setValue('name', name);
  });
  await act(async () => {
    result.current.profile.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useProfileForm', () => {
  it('RF-38: da el email, la fecha de alta y el nombre actual', () => {
    const { result } = setup({ ...USER, name: 'Ana' });
    expect(result.current.profile.email).toBe('ana@example.com');
    expect(result.current.profile.createdAt).toBe('2026-10-29T10:00:00.000Z');
    expect(result.current.profile.form.getValues('name')).toBe('Ana');
  });

  it('RF-38 y RF-53: guardar el nombre lo pone en la sesión (y en la navegación) y lo confirma', async () => {
    const api = mockApi({ 'PATCH /me': () => apiOk({ ...USER, name: 'Ana García' }) });
    const { result, store } = setup();
    expect(selectUserDisplayName(store.getState())).toBe('ana@example.com');
    await save(result, '  Ana García ');
    await waitFor(() => {
      expect(result.current.profile.notice).toBe('Nombre guardado.');
    });
    expect(await api.bodyOf('PATCH /me')).toEqual({ name: 'Ana García' });
    expect(selectUserDisplayName(store.getState())).toBe('Ana García');
    expect(result.current.profile.form.getValues('name')).toBe('Ana García');
    act(() => {
      result.current.profile.dismissNotice();
    });
    expect(result.current.profile.notice).toBeUndefined();
  });

  it('RF-46: solo espacios guarda el nombre vacío y deja el campo vacío', async () => {
    const api = mockApi({ 'PATCH /me': () => apiOk(USER) });
    const { result } = setup();
    await save(result, '   ');
    await waitFor(() => {
      expect(result.current.profile.notice).toBe('Nombre guardado.');
    });
    expect(await api.bodyOf('PATCH /me')).toEqual({ name: null });
    expect(result.current.profile.form.getValues('name')).toBe('');
  });

  it('RF-46: 101 caracteres muestran el error y no se envía nada', async () => {
    const api = mockApi({});
    const { result } = setup();
    await save(result, 'n'.repeat(101));
    await waitFor(() => {
      expect(result.current.errors.name?.message).toBe('El nombre no puede tener más de 100 caracteres.');
    });
    expect(api.requests).toHaveLength(0);
  });

  it('RF-41: si la API rechaza el nombre lo indica en el campo', async () => {
    mockApi({ 'PATCH /me': () => apiFail(400, 'VALIDATION_ERROR', [{ field: 'name', message: 'x' }]) });
    const { result } = setup();
    await save(result, 'Ana');
    await waitFor(() => {
      expect(result.current.errors.name?.message).toBe('Revisa este campo.');
    });
    expect(result.current.profile.notice).toBeUndefined();
  });

  it('RF-44: sin conexión muestra el mensaje general', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = setup();
    await save(result, 'Ana');
    await waitFor(() => {
      expect(result.current.profile.formError).toBe(
        'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
      );
    });
  });
});
