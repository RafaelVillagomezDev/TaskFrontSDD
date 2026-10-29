import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { useLoginForm } from '../use-login-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const csrf = () => apiOk({ csrfToken: 'previo-1' });

function setup(entry: Parameters<typeof appWrapper>[1] = '/login') {
  const store = freshStore();
  const view = renderHook(() => useLoginForm(), { wrapper: appWrapper(store, entry) });
  return { ...view, store };
}

async function submitWith(result: ReturnType<typeof setup>['result'], email: string, password: string) {
  act(() => {
    result.current.form.setValue('email', email);
    result.current.form.setValue('password', password);
  });
  await act(async () => {
    result.current.onSubmit();
    await Promise.resolve();
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useLoginForm', () => {
  it('un doble envío inicia sesión una sola vez', async () => {
    const api = mockApi({
      'GET /auth/csrf': csrf,
      'POST /auth/login': () => apiOk({ user: USER, csrfToken: 'sesion-1' }),
    });
    const { result, store } = setup();
    act(() => {
      result.current.form.setValue('email', 'ana@example.com');
      result.current.form.setValue('password', 'correct horse battery');
    });
    await act(async () => {
      result.current.onSubmit();
      result.current.onSubmit();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(store.getState().auth.status).toBe('authenticated');
    });
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(1);
  });

  it('RF-02: con campos no válidos muestra los errores y no envía nada a la API', async () => {
    const api = mockApi({});
    const { result } = setup();
    await submitWith(result, 'ana@', '');
    await waitFor(() => {
      expect(result.current.form.formState.errors.email?.message).toBe(
        'Escribe un email válido, como ana@ejemplo.com.',
      );
    });
    expect(result.current.form.formState.errors.password?.message).toBe('Escribe tu contraseña.');
    expect(api.requests).toHaveLength(0);
  });

  it('con credenciales correctas abre la sesión sin error', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiOk({ user: USER, csrfToken: 'sesion-1' }) });
    const { result, store } = setup();
    await submitWith(result, ' ana@example.com ', 'correct horse battery');
    await waitFor(() => {
      expect(store.getState().auth.status).toBe('authenticated');
    });
    expect(result.current.formError).toBeUndefined();
  });

  it('RF-04: email o contraseña incorrectos → mensaje genérico, sin decir cuál falló', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(401, 'INVALID_CREDENTIALS') });
    const { result, store } = setup();
    await submitWith(result, 'ana@example.com', 'mala');
    await waitFor(() => {
      expect(result.current.formError).toBe('El email o la contraseña no son correctos.');
    });
    expect(result.current.form.formState.errors.email).toBeUndefined();
    expect(result.current.form.formState.errors.password).toBeUndefined();
    expect(store.getState().auth.status).toBe('unknown');
  });

  it('RF-05: cuenta bloqueada → esperar 15 minutos', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(429, 'TOO_MANY_ATTEMPTS') });
    const { result } = setup();
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(result.current.formError).toBe(
        'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.',
      );
    });
  });

  it('RF-44: sin conexión → mensaje de red', async () => {
    mockApi({ 'GET /auth/csrf': () => Promise.reject(new TypeError('Failed to fetch')) });
    const { result } = setup();
    await submitWith(result, 'ana@example.com', 'x');
    await waitFor(() => {
      expect(result.current.formError).toBe(
        'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
      );
    });
  });

  it('RF-01: tras registrarse abre con el email escrito y el aviso de cuenta creada', () => {
    const { result } = setup({ pathname: '/login', state: { registered: true, email: 'ana@example.com' } });
    expect(result.current.form.getValues('email')).toBe('ana@example.com');
    expect(result.current.notice).toBe('registered');
  });

  it('RF-07: con reason=expired avisa de la sesión caducada', () => {
    const { result } = setup('/login?returnTo=%2Fhistory&reason=expired');
    expect(result.current.notice).toBe('expired');
    expect(result.current.form.getValues('email')).toBe('');
  });

  it('sin aviso por defecto; un estado de navegación ajeno se ignora', () => {
    const { result } = setup({ pathname: '/login', state: { registered: 'sí' } });
    expect(result.current.notice).toBeNull();
  });
});
