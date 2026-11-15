import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { attachTurnstile, installFakeTurnstile } from '@test-utils/fake-turnstile';
import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { useLoginForm } from '../use-login-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const csrf = () => apiOk({ csrfToken: 'previo-1' });

async function setup(entry: Parameters<typeof appWrapper>[1] = '/login') {
  const store = freshStore();
  const view = renderHook(() => useLoginForm(), { wrapper: appWrapper(store, entry) });
  await attachTurnstile(() => view.result.current.turnstile);
  return { ...view, store };
}

async function submitWith(result: Awaited<ReturnType<typeof setup>>['result'], email: string, password: string) {
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
    const { result, store } = await setup();
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
    const { result } = await setup();
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
    const { result, store } = await setup();
    await submitWith(result, ' ana@example.com ', 'correct horse battery');
    await waitFor(() => {
      expect(store.getState().auth.status).toBe('authenticated');
    });
    expect(result.current.formError).toBeUndefined();
  });

  it('RF-04: email o contraseña incorrectos → mensaje genérico, sin decir cuál falló', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(401, 'INVALID_CREDENTIALS') });
    const { result, store } = await setup();
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
    const { result } = await setup();
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(result.current.formError).toBe(
        'Demasiados intentos fallidos. Espera 15 minutos antes de volver a intentarlo.',
      );
    });
  });

  it('RF-44: sin conexión → mensaje de red', async () => {
    mockApi({ 'GET /auth/csrf': () => Promise.reject(new TypeError('Failed to fetch')) });
    const { result } = await setup();
    await submitWith(result, 'ana@example.com', 'x');
    await waitFor(() => {
      expect(result.current.formError).toBe(
        'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
      );
    });
  });

  it('RF-01: tras registrarse abre con el email escrito y el aviso de cuenta creada', async () => {
    const { result } = await setup({ pathname: '/login', state: { registered: true, email: 'ana@example.com' } });
    expect(result.current.form.getValues('email')).toBe('ana@example.com');
    expect(result.current.notice).toBe('registered');
  });

  it('RF-07: con reason=expired avisa de la sesión caducada', async () => {
    const { result } = await setup('/login?returnTo=%2Fhistory&reason=expired');
    expect(result.current.notice).toBe('expired');
    expect(result.current.form.getValues('email')).toBe('');
  });

  it('sin aviso por defecto; un estado de navegación ajeno se ignora', async () => {
    const { result } = await setup({ pathname: '/login', state: { registered: 'sí' } });
    expect(result.current.notice).toBeNull();
  });
});

describe('useLoginForm con Turnstile (spec 005)', () => {
  const FAILED = 'No hemos podido comprobar que eres una persona. Inténtalo de nuevo.';

  it('RF-03: sin token no envía nada y pide completar la comprobación, sin borrar lo escrito', async () => {
    const fake = installFakeTurnstile();
    const api = mockApi({});
    const { result } = renderHook(() => useLoginForm(), { wrapper: appWrapper(freshStore(), '/login') });
    act(() => {
      result.current.turnstile.containerRef(document.createElement('div'));
    });
    await waitFor(() => {
      expect(result.current.turnstile.status).toBe('ready');
    });
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(result.current.turnstileError).toBe('Completa la comprobación de seguridad.');
    });
    expect(api.requests).toHaveLength(0);
    expect(result.current.form.getValues('email')).toBe('ana@example.com');
    // En cuanto llega el token, el aviso desaparece
    act(() => {
      fake.solve();
    });
    expect(result.current.turnstileError).toBeUndefined();
  });

  it('RF-07: envía el token de Turnstile en el cuerpo, junto a las credenciales', async () => {
    const api = mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiOk({ user: USER, csrfToken: 's' }) });
    const { result } = await setup();
    const token = result.current.turnstile.token;
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(api.requests).toHaveLength(2);
    });
    expect(await api.bodyOf('POST /auth/login')).toEqual({
      email: 'ana@example.com',
      password: 'correct horse battery',
      turnstileToken: token,
    });
  });

  it('RF-05: tras INVALID_CREDENTIALS reinicia el widget y el siguiente intento lleva otro token', async () => {
    const api = mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(401, 'INVALID_CREDENTIALS') });
    const { result } = await setup();
    await submitWith(result, 'ana@example.com', 'mala-contraseña');
    await waitFor(() => {
      expect(result.current.formError).toBe('El email o la contraseña no son correctos.');
    });
    await submitWith(result, 'ana@example.com', 'mala-contraseña');
    await waitFor(() => {
      expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(2);
    });
    const first = await api.bodyOf('POST /auth/login', 0);
    const second = await api.bodyOf('POST /auth/login', 1);
    expect(first).not.toEqual(second);
  });

  it('RF-05: también reinicia el widget tras un fallo de red', async () => {
    mockApi({
      'GET /auth/csrf': csrf,
      'POST /auth/login': () => Promise.reject(new TypeError('Failed to fetch')),
    });
    const { result } = await setup();
    const before = result.current.turnstile.token;
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(result.current.formError).toBe(
        'No hay conexión con el servidor. Comprueba tu conexión e inténtalo de nuevo.',
      );
    });
    expect(result.current.turnstile.token).not.toBe(before);
  });

  it('RF-08: TURNSTILE_FAILED → mensaje bajo el widget, sin error general y sin borrar lo escrito', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(403, 'TURNSTILE_FAILED') });
    const { result } = await setup();
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(result.current.turnstileError).toBe(FAILED);
    });
    expect(result.current.formError).toBeUndefined();
    expect(result.current.form.getValues('password')).toBe('correct horse battery');
  });

  it('RF-13: TURNSTILE_UNAVAILABLE → el servicio de verificación no responde', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/login': () => apiFail(503, 'TURNSTILE_UNAVAILABLE') });
    const { result } = await setup();
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(result.current.turnstileError).toBe(
        'El servicio de verificación no responde. Inténtalo de nuevo en unos minutos.',
      );
    });
  });

  it('RF-14: VALIDATION_ERROR sobre turnstileToken → mensaje de RF-08, sin marcar ningún campo', async () => {
    mockApi({
      'GET /auth/csrf': csrf,
      'POST /auth/login': () => apiFail(400, 'VALIDATION_ERROR', [{ field: 'turnstileToken', message: 'x' }]),
    });
    const { result } = await setup();
    await submitWith(result, 'ana@example.com', 'correct horse battery');
    await waitFor(() => {
      expect(result.current.turnstileError).toBe(FAILED);
    });
    expect(result.current.form.formState.errors.email).toBeUndefined();
    expect(result.current.form.formState.errors.password).toBeUndefined();
  });

  it('RF-06: si Turnstile no carga, lo indica bajo el widget', async () => {
    const fake = installFakeTurnstile();
    const { result } = renderHook(() => useLoginForm(), { wrapper: appWrapper(freshStore(), '/login') });
    act(() => {
      result.current.turnstile.containerRef(document.createElement('div'));
    });
    await waitFor(() => {
      expect(result.current.turnstile.status).toBe('ready');
    });
    act(() => {
      fake.lastOptions()['error-callback']();
    });
    expect(result.current.turnstileError).toBe(
      'No se ha podido cargar la comprobación de seguridad. Recarga la página para intentarlo de nuevo.',
    );
  });
});
