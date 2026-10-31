import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { baseApi } from '../../../../shared/api/base.api';
import type { TodayProgress } from '../../types/streak.types';
import { useStreakPanel } from '../use-streak-panel.hook';

function setup(progress: TodayProgress | undefined, store = freshStore()) {
  return renderHook(
    ({ value, saving }: { value: TodayProgress | undefined; saving: boolean }) => useStreakPanel(value, saving),
    { wrapper: appWrapper(store, '/'), initialProps: { value: progress, saving: false } },
  );
}

async function readyPanel(streak: { current: number; best: number }, progress: TodayProgress | undefined) {
  mockApi({ 'GET /streak': () => apiOk(streak) });
  const view = setup(progress);
  await waitFor(() => {
    expect(view.result.current.status).toBe('ready');
  });
  return view;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useStreakPanel', () => {
  it('RF-25: muestra la racha actual y la mejor tal como las devuelve la API, sin recalcularlas', async () => {
    const { result } = await readyPanel({ current: 4, best: 9 }, { done: 0, total: 0 });
    expect(result.current.streak).toEqual({ current: 4, best: 9 });
  });

  it('RF-26: el progreso de hoy es el que calcula el tablero', async () => {
    const { result } = await readyPanel({ current: 1, best: 1 }, { done: 1, total: 3 });
    expect(result.current.progress).toEqual({ done: 1, total: 3 });
    expect(result.current.hasNoTasksToday).toBe(false);
  });

  it.each([
    ['racha > 0 y ninguna completada hoy', true, 4, { done: 0, total: 2 }],
    ['racha > 0, sin tareas hoy', true, 4, { done: 0, total: 0 }],
    ['racha > 0 y una completada hoy', false, 4, { done: 1, total: 2 }],
    ['racha 0 y ninguna completada', false, 0, { done: 0, total: 2 }],
  ])('RF-27: %s → racha en juego: %s', async (_case, atRisk, current, progress) => {
    const { result } = await readyPanel({ current, best: 5 }, progress);
    expect(result.current.atRisk).toBe(atRisk);
  });

  it('RF-27: mientras el progreso no ha llegado, no avisa de que la racha está en juego', async () => {
    const { result } = await readyPanel({ current: 4, best: 5 }, undefined);
    expect(result.current.atRisk).toBe(false);
    expect(result.current.hasNoTasksToday).toBe(false);
  });

  it('RF-28: sin tareas hoy lo indica', async () => {
    const { result } = await readyPanel({ current: 0, best: 0 }, { done: 0, total: 0 });
    expect(result.current.hasNoTasksToday).toBe(true);
  });

  it('CE-02: al cambiar el progreso se recalcula sin volver a pedir la racha', async () => {
    const api = mockApi({ 'GET /streak': () => apiOk({ current: 2, best: 2 }) });
    const { result, rerender } = setup({ done: 0, total: 1 });
    await waitFor(() => {
      expect(result.current.atRisk).toBe(true);
    });
    rerender({ value: { done: 1, total: 1 }, saving: false });
    expect(result.current.atRisk).toBe(false);
    expect(api.requests).toHaveLength(1);
  });

  it('RF-44: si la racha falla, da el mensaje y reintenta', async () => {
    let fails = true;
    mockApi({
      'GET /streak': () => (fails ? apiFail(500, 'INTERNAL_ERROR') : apiOk({ current: 1, best: 3 })),
    });
    const { result } = setup({ done: 0, total: 0 });
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.errorMessage).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    fails = false;
    act(() => {
      result.current.retry();
    });
    await waitFor(() => {
      expect(result.current.streak).toEqual({ current: 1, best: 3 });
    });
    expect(result.current.errorMessage).toBeUndefined();
  });

  it('RF-27 (T115): mientras la racha se recalcula tras un cambio no avisa; avisa si al llegar sigue en juego', async () => {
    let release: (response: Response) => void = () => undefined;
    let calls = 0;
    mockApi({
      'GET /streak': () => {
        calls += 1;
        if (calls === 1) return apiOk({ current: 3, best: 3 });
        return new Promise<Response>((resolve) => {
          release = resolve;
        });
      },
    });
    const store = freshStore();
    const { result, rerender } = setup({ done: 1, total: 1 }, store);
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });
    // Se desmarca la única tarea de hoy: el progreso cambia al momento y la racha se vuelve a pedir
    act(() => {
      store.dispatch(baseApi.util.invalidateTags(['Streak']));
    });
    rerender({ value: { done: 0, total: 1 }, saving: false });
    await waitFor(() => {
      expect(calls).toBe(2);
    });
    expect(result.current.atRisk).toBe(false);
    // La racha de días anteriores sigue en 2: ahora sí está en juego
    await act(async () => {
      release(apiOk({ current: 2, best: 3 }));
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(result.current.atRisk).toBe(true);
    });
  });

  it('RF-27 (T115): mientras el tablero guarda un completar o desmarcar no avisa; al guardarse, sí', async () => {
    const { result, rerender } = await readyPanel({ current: 2, best: 2 }, { done: 0, total: 1 });
    expect(result.current.atRisk).toBe(true);
    rerender({ value: { done: 0, total: 1 }, saving: true });
    expect(result.current.atRisk).toBe(false);
    rerender({ value: { done: 0, total: 1 }, saving: false });
    expect(result.current.atRisk).toBe(true);
  });
});
