import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '../../../../../jest/render-app';
import { useRegisterForm } from '../use-register-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const VALUES = { email: 'Ana@Example.com', password: 'correct horse battery', name: 'Ana' };
const csrf = () => apiOk({ csrfToken: 'previo-1' });

function setup() {
  const store = freshStore();
  return renderHook(() => ({ register: useRegisterForm(), router: useRouterProbe() }), {
    wrapper: appWrapper(store, '/register'),
  });
}

async function submitWith(result: ReturnType<typeof setup>['result'], values: typeof VALUES) {
  act(() => {
    result.current.register.form.setValue('email', values.email);
    result.current.register.form.setValue('password', values.password);
    result.current.register.form.setValue('name', values.name);
  });
  await act(async () => {
    result.current.register.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useRegisterForm', () => {
  it('RF-01: crea la cuenta y lleva al inicio de sesión con el email ya escrito y el aviso', async () => {
    const api = mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiOk(USER, 201) });
    const { result } = setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.router.location.pathname).toBe('/login');
    });
    expect(result.current.router.location.state).toEqual({ registered: true, email: 'ana@example.com' });
    expect(await api.bodyOf('POST /auth/register')).toEqual(VALUES);
  });

  it('RF-02: con campos no válidos muestra cada error y no envía nada', async () => {
    const api = mockApi({});
    const { result } = setup();
    await submitWith(result, { email: '', password: 'a'.repeat(11), name: 'n'.repeat(101) });
    await waitFor(() => {
      expect(result.current.register.form.formState.errors.email?.message).toBe('Escribe tu email.');
    });
    const { errors } = result.current.register.form.formState;
    expect(errors.password?.message).toBe('La contraseña debe tener al menos 12 caracteres.');
    expect(errors.name?.message).toBe('El nombre no puede tener más de 100 caracteres.');
    expect(api.requests).toHaveLength(0);
  });

  it('RF-03: email ya registrado → error en el email sin borrar el resto', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(409, 'EMAIL_ALREADY_REGISTERED') });
    const { result } = setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.form.formState.errors.email?.message).toBe('Ya existe una cuenta con este email.');
    });
    expect(result.current.register.form.getValues()).toEqual(VALUES);
    expect(result.current.router.location.pathname).toBe('/register');
  });

  it('RF-41: VALIDATION_ERROR de la API → cada mensaje bajo su campo', async () => {
    mockApi({
      'GET /auth/csrf': csrf,
      'POST /auth/register': () =>
        apiFail(400, 'VALIDATION_ERROR', [
          { field: 'password', message: 'La contraseña debe tener entre 12 y 128 caracteres' },
          { field: 'otro', message: 'Ignorado' },
        ]),
    });
    const { result } = setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.form.formState.errors.password?.message).toBe(
        'La contraseña debe tener entre 12 y 128 caracteres',
      );
    });
    expect(result.current.register.formError).toBeUndefined();
  });

  it('RF-44: otro error → mensaje general', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(500, 'INTERNAL_ERROR') });
    const { result } = setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.formError).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    });
  });
});
