/**
 * @jest-environment node
 */
import { jest } from '@jest/globals';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { toApiError } from '../../../../shared/api/api-error.util';
import { baseApi } from '../../../../shared/api/base.api';
import { createAppStore, type AppStore } from '../../../../shared/store/store';
import { selectCurrentUser, sessionStarted } from '../../../auth';
import { accountApi } from '../account.api';

const USER = { id: 'u1', email: 'ana@example.com', name: null, createdAt: '2026-10-29T10:00:00.000Z' };

let store: AppStore;

beforeEach(() => {
  store = createAppStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
});

afterEach(() => {
  store.dispatch(baseApi.util.resetApiState());
  jest.restoreAllMocks();
});

describe('D-5: accountApi.updateProfile', () => {
  it('RF-38 y RF-53: envía PATCH /me con el nombre y el token CSRF, y actualiza el usuario de la sesión', async () => {
    const api = mockApi({ 'PATCH /me': () => apiOk({ ...USER, name: 'Ana' }) });
    const result = await store.dispatch(accountApi.endpoints.updateProfile.initiate({ name: 'Ana' }));
    expect(result.data).toEqual({ ...USER, name: 'Ana' });
    expect(await api.bodyOf('PATCH /me')).toEqual({ name: 'Ana' });
    expect(api.requests[0]?.headers.get('X-CSRF-Token')).toBe('sesion-1');
    expect(selectCurrentUser(store.getState())?.name).toBe('Ana');
  });

  it('un nombre vacío se envía como null y lo borra', async () => {
    const api = mockApi({ 'PATCH /me': () => apiOk(USER) });
    await store.dispatch(accountApi.endpoints.updateProfile.initiate({ name: '' }));
    expect(await api.bodyOf('PATCH /me')).toEqual({ name: null });
  });

  it('si la API rechaza, no cambia el usuario de la sesión', async () => {
    mockApi({ 'PATCH /me': () => apiFail(400, 'VALIDATION_ERROR', [{ field: 'name', message: 'x' }]) });
    const result = await store.dispatch(accountApi.endpoints.updateProfile.initiate({ name: 'Ana' }));
    expect(toApiError(result.error).code).toBe('VALIDATION_ERROR');
    expect(selectCurrentUser(store.getState())).toEqual(USER);
  });
});

describe('D-5: accountApi.changePassword y deleteAccount', () => {
  it('RF-39: envía PATCH /me/password con la actual y la nueva y el token CSRF', async () => {
    const api = mockApi({ 'PATCH /me/password': () => apiOk(null) });
    const values = { currentPassword: 'actual', newPassword: 'n'.repeat(12) };
    const result = await store.dispatch(accountApi.endpoints.changePassword.initiate(values));
    expect(result.data).toBeNull();
    expect(await api.bodyOf('PATCH /me/password')).toEqual(values);
    expect(api.requests[0]?.headers.get('X-CSRF-Token')).toBe('sesion-1');
  });

  it('RF-48: una contraseña incorrecta llega como WRONG_PASSWORD', async () => {
    mockApi({ 'PATCH /me/password': () => apiFail(403, 'WRONG_PASSWORD') });
    const result = await store.dispatch(
      accountApi.endpoints.changePassword.initiate({ currentPassword: 'mal', newPassword: 'n'.repeat(12) }),
    );
    expect(toApiError(result.error).code).toBe('WRONG_PASSWORD');
  });

  it('RF-49: envía DELETE /me con la contraseña y el token CSRF', async () => {
    const api = mockApi({ 'DELETE /me': () => apiOk(null) });
    const result = await store.dispatch(accountApi.endpoints.deleteAccount.initiate({ password: 'actual' }));
    expect(result.data).toBeNull();
    expect(await api.bodyOf('DELETE /me')).toEqual({ password: 'actual' });
    expect(api.requests[0]?.headers.get('X-CSRF-Token')).toBe('sesion-1');
  });
});
