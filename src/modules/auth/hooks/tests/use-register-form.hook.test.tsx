import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { attachTurnstile, FAKE_TURNSTILE_TOKEN, installFakeTurnstile } from '@test-utils/fake-turnstile';
import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore, useRouterProbe } from '@test-utils/render-app';
import { useRegisterForm } from '../use-register-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const VALUES = { email: 'Ana@Example.com', password: 'correct horse battery', name: 'Ana' };
const csrf = () => apiOk({ csrfToken: 'previo-1' });

async function setup() {
  const store = freshStore();
  const view = renderHook(() => ({ register: useRegisterForm(), router: useRouterProbe() }), {
    wrapper: appWrapper(store, '/register'),
  });
  await attachTurnstile(() => view.result.current.register.turnstile);
  return view;
}

async function submitWith(result: Awaited<ReturnType<typeof setup>>['result'], values: typeof VALUES) {
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
  it('un doble envío crea la cuenta una sola vez, sin el falso «email ya registrado»', async () => {
    const api = mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiOk(USER, 201) });
    const { result } = await setup();
    act(() => {
      result.current.register.form.setValue('email', VALUES.email);
      result.current.register.form.setValue('password', VALUES.password);
    });
    await act(async () => {
      result.current.register.onSubmit();
      result.current.register.onSubmit();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.router.location.pathname).toBe('/login');
    });
    expect(api.requests.filter((request) => request.method === 'POST')).toHaveLength(1);
  });

  it('RF-01: crea la cuenta y lleva al inicio de sesión con el email ya escrito y el aviso', async () => {
    const api = mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiOk(USER, 201) });
    const { result } = await setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.router.location.pathname).toBe('/login');
    });
    expect(result.current.router.location.state).toEqual({ registered: true, email: 'ana@example.com' });
    const body = await api.bodyOf('POST /auth/register');
    expect(body).toMatchObject(VALUES);
    // 005 RF-07: con el token de Turnstile
    expect(JSON.stringify(body)).toContain(FAKE_TURNSTILE_TOKEN);
  });

  it('RF-02: con campos no válidos muestra cada error y no envía nada', async () => {
    const api = mockApi({});
    const { result } = await setup();
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
    const { result } = await setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.form.formState.errors.email?.message).toBe('Ya existe una cuenta con este email.');
    });
    expect(result.current.register.form.getValues()).toEqual(VALUES);
    expect(result.current.router.location.pathname).toBe('/register');
  });

  it('RF-41: VALIDATION_ERROR de la API → «Revisa este campo.» bajo cada campo, nunca el texto técnico de la API', async () => {
    mockApi({
      'GET /auth/csrf': csrf,
      'POST /auth/register': () =>
        apiFail(400, 'VALIDATION_ERROR', [
          { field: 'password', message: 'Demasiado pequeño: se esperaba que texto tuviera >=12 caracteres' },
          { field: 'otro', message: 'Ignorado' },
        ]),
    });
    const { result } = await setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.form.formState.errors.password?.message).toBe('Revisa este campo.');
    });
    expect(result.current.register.formError).toBeUndefined();
  });

  it('RF-44: otro error → mensaje general', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(500, 'INTERNAL_ERROR') });
    const { result } = await setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.formError).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    });
  });
});

describe('useRegisterForm con Turnstile (spec 005)', () => {
  it('RF-03: sin token no envía nada y pide completar la comprobación', async () => {
    installFakeTurnstile();
    const api = mockApi({});
    const view = renderHook(() => ({ register: useRegisterForm(), router: useRouterProbe() }), {
      wrapper: appWrapper(freshStore(), '/register'),
    });
    act(() => {
      view.result.current.register.turnstile.containerRef(document.createElement('div'));
    });
    await waitFor(() => {
      expect(view.result.current.register.turnstile.status).toBe('ready');
    });
    await submitWith(view.result, VALUES);
    await waitFor(() => {
      expect(view.result.current.register.turnstileError).toBe('Completa la comprobación de seguridad.');
    });
    expect(api.requests).toHaveLength(0);
  });

  it('RF-05, RF-15: tras EMAIL_ALREADY_REGISTERED reinicia el widget y marca el email como siempre', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(409, 'EMAIL_ALREADY_REGISTERED') });
    const { result } = await setup();
    const before = result.current.register.turnstile.token;
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.form.formState.errors.email?.message).toBe('Ya existe una cuenta con este email.');
    });
    expect(result.current.register.turnstile.token).not.toBe(before);
    expect(result.current.register.turnstileError).toBeUndefined();
  });

  it('RF-08: TURNSTILE_FAILED → mensaje bajo el widget, sin crear la cuenta ni borrar lo escrito', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(403, 'TURNSTILE_FAILED') });
    const { result } = await setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.turnstileError).toBe(
        'No hemos podido comprobar que eres una persona. Inténtalo de nuevo.',
      );
    });
    expect(result.current.router.location.pathname).toBe('/register');
    expect(result.current.register.form.getValues()).toEqual(VALUES);
  });

  it('RF-13: TURNSTILE_UNAVAILABLE → el servicio de verificación no responde', async () => {
    mockApi({ 'GET /auth/csrf': csrf, 'POST /auth/register': () => apiFail(503, 'TURNSTILE_UNAVAILABLE') });
    const { result } = await setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.turnstileError).toBe(
        'El servicio de verificación no responde. Inténtalo de nuevo en unos minutos.',
      );
    });
  });

  it('RF-14: VALIDATION_ERROR sobre turnstileToken → mensaje de RF-08, sin marcar campos', async () => {
    mockApi({
      'GET /auth/csrf': csrf,
      'POST /auth/register': () => apiFail(400, 'VALIDATION_ERROR', [{ field: 'turnstileToken', message: 'x' }]),
    });
    const { result } = await setup();
    await submitWith(result, VALUES);
    await waitFor(() => {
      expect(result.current.register.turnstileError).toBe(
        'No hemos podido comprobar que eres una persona. Inténtalo de nuevo.',
      );
    });
    expect(result.current.register.form.formState.errors.email).toBeUndefined();
    expect(result.current.register.formError).toBeUndefined();
  });
});
