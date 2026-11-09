import type { ReactNode } from 'react';
import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { pomodoroFixture } from '../../tests/pomodoro.fixtures';
import { useSessionDetail } from '../use-session-detail.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

// El id llega de la ruta /pomodoro/history/:id (RF-54)
function setup(id = 'p-1') {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/pomodoro/history/${id}`]}>
          <Routes>
            <Route path="/pomodoro/history/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
  }
  return renderHook(() => useSessionDetail(), { wrapper: Wrapper });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useSessionDetail', () => {
  it('RF-40 y RF-54: carga la sesión del id de la ruta', async () => {
    const session = pomodoroFixture({ id: 'p-7', status: 'finished' });
    const api = mockApi({ 'GET /pomodoros/p-7': () => apiOk(session) });
    const { result } = setup('p-7');

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    expect(result.current.session).toEqual(session);
    expect(api.requests).toHaveLength(1);
  });

  it('RF-49: POMODORO_NOT_FOUND da el estado de sesión no encontrada', async () => {
    mockApi({ 'GET /pomodoros/otra': () => apiFail(404, 'POMODORO_NOT_FOUND') });
    const { result } = setup('otra');

    await waitFor(() => {
      expect(result.current.status).toBe('notFound');
    });
    expect(result.current.session).toBeUndefined();
  });

  it('RF-49: un id con un formato que la API no acepta también es una sesión no encontrada', async () => {
    mockApi({ 'GET /pomodoros/abc': () => apiFail(400, 'VALIDATION_ERROR') });
    const { result } = setup('abc');

    await waitFor(() => {
      expect(result.current.status).toBe('notFound');
    });
  });

  it('RF-44 (001): otro error da el mensaje y reintentar repite la consulta', async () => {
    let calls = 0;
    mockApi({
      'GET /pomodoros/p-1': () => {
        calls += 1;
        return calls === 1 ? apiFail(500, 'INTERNAL_ERROR') : apiOk(pomodoroFixture({ status: 'finished' }));
      },
    });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toEqual(expect.any(String));

    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
  });
});
