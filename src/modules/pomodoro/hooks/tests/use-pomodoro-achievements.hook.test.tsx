import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { formatDateTime } from '@shared/date/date-format.util';
import { achievementFixture, catalogFixture } from '../../tests/pomodoro.fixtures';
import { usePomodoroAchievements } from '../use-pomodoro-achievements.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function setup() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(() => usePomodoroAchievements(), { wrapper: appWrapper(store, '/pomodoro/achievements') });
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePomodoroAchievements', () => {
  it('RF-41 y RF-42: da la racha del pomodoro y los 11 logros en el orden de la API', async () => {
    mockApi({
      'GET /pomodoro-streak': () => apiOk({ current: 0, best: 0 }),
      'GET /pomodoro-achievements': () => apiOk(catalogFixture()),
    });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.achievements.status).toBe('ready');
    });
    await waitFor(() => {
      expect(result.current.streak.status).toBe('ready');
    });
    expect(result.current.streak.value).toEqual({ current: 0, best: 0 });
    expect(result.current.achievements.items.map((item) => item.code)).toEqual(
      catalogFixture().map((achievement) => achievement.code),
    );
  });

  it('RF-42 y RF-43: el progreso va sobre la meta y un logro conseguido lleva su fecha', async () => {
    const unlockedAt = '2026-11-09T18:30:00Z';
    mockApi({
      'GET /pomodoro-streak': () => apiOk({ current: 1, best: 1 }),
      'GET /pomodoro-achievements': () =>
        apiOk([
          achievementFixture({ code: 'FIRST_POMODORO', progress: 1, unlocked: true, unlockedAt }),
          achievementFixture({ code: 'SESSIONS_10', name: 'Concentrado', target: 10, progress: 3 }),
        ]),
    });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.achievements.items).toHaveLength(2);
    });
    const [first, second] = result.current.achievements.items;
    expect(first?.unlockedLabel).toBe(`Conseguido el ${formatDateTime(unlockedAt)}`);
    expect(first?.progressLabel).toBe('1 de 1');
    expect(second?.unlockedLabel).toBeUndefined();
    expect(second?.progressLabel).toBe('3 de 10');
  });

  it('RF-44: FOCUS_10H muestra la meta y el progreso en horas y minutos', async () => {
    mockApi({
      'GET /pomodoro-streak': () => apiOk({ current: 0, best: 0 }),
      'GET /pomodoro-achievements': () =>
        apiOk([achievementFixture({ code: 'FOCUS_10H', name: 'Diez horas', target: 600, progress: 450 })]),
    });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.achievements.items[0]?.progressLabel).toBe('7 h 30 min de 10 h');
    });
  });

  it('RF-67: un fallo de la racha no afecta a los logros y reintentar solo repite la racha', async () => {
    let streakCalls = 0;
    const api = mockApi({
      'GET /pomodoro-streak': () => {
        streakCalls += 1;
        return streakCalls === 1 ? apiFail(500, 'INTERNAL_ERROR') : apiOk({ current: 2, best: 4 });
      },
      'GET /pomodoro-achievements': () => apiOk(catalogFixture()),
    });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.streak.status).toBe('error');
    });
    await waitFor(() => {
      expect(result.current.achievements.status).toBe('ready');
    });
    expect(result.current.streak.errorMessage).toEqual(expect.any(String));

    act(() => {
      result.current.streak.retry();
    });
    await waitFor(() => {
      expect(result.current.streak.value).toEqual({ current: 2, best: 4 });
    });
    expect(api.requests.filter((request) => request.url.endsWith('/pomodoro-achievements'))).toHaveLength(1);
  });

  it('RF-44 (001): si fallan los logros da el mensaje y reintentar los vuelve a pedir', async () => {
    let calls = 0;
    mockApi({
      'GET /pomodoro-streak': () => apiOk({ current: 0, best: 0 }),
      'GET /pomodoro-achievements': () => {
        calls += 1;
        return calls === 1 ? apiFail(500, 'INTERNAL_ERROR') : apiOk(catalogFixture());
      },
    });
    const { result } = setup();

    await waitFor(() => {
      expect(result.current.achievements.status).toBe('error');
    });
    act(() => {
      result.current.achievements.retry();
    });
    await waitFor(() => {
      expect(result.current.achievements.items).toHaveLength(11);
    });
  });
});
