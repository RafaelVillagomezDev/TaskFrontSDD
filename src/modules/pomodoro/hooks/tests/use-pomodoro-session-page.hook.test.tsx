import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { pomodoroFixture, pomodoroPage } from '../../tests/pomodoro.fixtures';
import { usePomodoroSessionPage } from '../use-pomodoro-session-page.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => usePomodoroSessionPage(), { wrapper: appWrapper(store, '/pomodoro') });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePomodoroSessionPage', () => {
  it('RF-63: al empezar una sesión lo anuncia con el tiempo que tiene', async () => {
    let started = false;
    mockApi({
      'GET /pomodoros': () => pomodoroPage(started ? [pomodoroFixture()] : []),
      'GET /pomodoros/p-1': () => apiOk(pomodoroFixture()),
      'POST /pomodoros': () => {
        started = true;
        return apiOk(pomodoroFixture(), 201);
      },
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.view.kind).toBe('form');
    });

    await act(async () => {
      result.current.startForm.onSubmit();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.timer.announcer.actionMessage).toBe('Sesión empezada. Quedan 25 minutos.');
    });
    await waitFor(() => {
      expect(result.current.view.kind).toBe('session');
    });
  });

  it('RF-72: terminar a mano lleva al resultado; «Empezar otra sesión» vuelve al formulario', async () => {
    let finished = false;
    mockApi({
      'GET /pomodoros': () => pomodoroPage([pomodoroFixture({ status: finished ? 'finished' : 'running' })]),
      'GET /pomodoros/p-1': () => apiOk(pomodoroFixture({ status: finished ? 'finished' : 'running' })),
      'PATCH /pomodoros/p-1': () => {
        finished = true;
        return apiOk(pomodoroFixture({ status: 'finished' }));
      },
    });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current.view.kind).toBe('session');
    });

    await act(async () => {
      await result.current.actions.confirmFinish();
    });
    await waitFor(() => {
      expect(result.current.view.kind).toBe('result');
    });

    act(() => {
      result.current.startAnother();
    });
    expect(result.current.view.kind).toBe('form');
  });
});
