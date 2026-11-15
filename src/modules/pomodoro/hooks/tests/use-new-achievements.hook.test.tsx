import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import type { AppStore } from '@shared/store/store';
import { pomodoroApi } from '../../api/pomodoro.api';
import { achievementFixture, pomodoroFixture } from '../../tests/pomodoro.fixtures';
import type { SessionView } from '../use-active-session.hook';
import { useNewAchievements } from '../use-new-achievements.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

const ACTIVE: SessionView = { kind: 'session', session: pomodoroFixture() };
const RESULT: SessionView = { kind: 'result', id: 'p-1', session: undefined };
const FORM: SessionView = { kind: 'form' };

const LOCKED = [
  achievementFixture({ code: 'FIRST_POMODORO', name: 'Primer pomodoro' }),
  achievementFixture({ code: 'TASKS_10', name: 'Cumplidor', target: 10, progress: 9 }),
];
const UNLOCKED_FIRST = [
  achievementFixture({ code: 'FIRST_POMODORO', name: 'Primer pomodoro', progress: 1, unlocked: true, unlockedAt: 'x' }),
  achievementFixture({ code: 'TASKS_10', name: 'Cumplidor', target: 10, progress: 9 }),
];

let store: AppStore;

function setup(initial: SessionView) {
  store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return renderHook(({ view }) => useNewAchievements(view), {
    wrapper: appWrapper(store, '/pomodoro'),
    initialProps: { view: initial },
  });
}

// La API responde con la referencia la primera vez y con los logros del final después
function achievementsApi(atStart: unknown, atEnd: () => Response) {
  let calls = 0;
  return mockApi({
    'GET /pomodoro-achievements': () => {
      calls += 1;
      return calls === 1 ? apiOk(atStart) : atEnd();
    },
  });
}

function achievementRequests(requests: Request[]): number {
  return requests.filter((request) => request.url.endsWith('/pomodoro-achievements')).length;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useNewAchievements', () => {
  it('RF-45 y RF-68: compara los logros del final con la referencia del inicio y da los nuevos', async () => {
    const api = achievementsApi(LOCKED, () => apiOk(UNLOCKED_FIRST));
    const { result, rerender } = setup(ACTIVE);
    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(1);
    });

    rerender({ view: RESULT });

    await waitFor(() => {
      expect(result.current.unlocked.map((achievement) => achievement.name)).toEqual(['Primer pomodoro']);
    });
  });

  it('RF-69: si ningún logro pasa a conseguido no hay nada que avisar', async () => {
    const api = achievementsApi(LOCKED, () => apiOk(LOCKED));
    const { result, rerender } = setup(ACTIVE);
    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(1);
    });

    rerender({ view: RESULT });

    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(2);
    });
    expect(result.current.unlocked).toEqual([]);
  });

  it('RF-70: si falla la consulta del final no hay aviso ni error', async () => {
    const api = achievementsApi(LOCKED, () => apiFail(500, 'INTERNAL_ERROR'));
    const { result, rerender } = setup(ACTIVE);
    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(1);
    });

    rerender({ view: RESULT });

    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(2);
    });
    expect(result.current.unlocked).toEqual([]);
  });

  it('RF-45: un logro que ya estaba conseguido al empezar no es nuevo', async () => {
    const api = achievementsApi(UNLOCKED_FIRST, () => apiOk(UNLOCKED_FIRST));
    const { result, rerender } = setup(ACTIVE);
    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(1);
    });

    rerender({ view: RESULT });

    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(2);
    });
    expect(result.current.unlocked).toEqual([]);
  });

  it('RF-45: sin sesión activa ni resultado no pide los logros', async () => {
    const api = mockApi({ 'GET /pomodoro-achievements': () => apiOk(LOCKED) });
    setup(FORM);

    await act(async () => {
      await Promise.resolve();
    });
    expect(achievementRequests(api.requests)).toBe(0);
  });

  it('RF-68: al cerrar el resultado se vuelven a pedir los logros de «Logros»', async () => {
    const api = mockApi({ 'GET /pomodoro-achievements': () => apiOk(UNLOCKED_FIRST) });
    const { result } = setup(FORM);
    const page = store.dispatch(pomodoroApi.endpoints.getPomodoroAchievements.initiate('current'));
    await page;
    expect(achievementRequests(api.requests)).toBe(1);

    act(() => {
      result.current.close();
    });

    await waitFor(() => {
      expect(achievementRequests(api.requests)).toBe(2);
    });
    page.unsubscribe();
  });
});
