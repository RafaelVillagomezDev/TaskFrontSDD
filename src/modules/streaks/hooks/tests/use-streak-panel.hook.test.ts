import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import type { TodayProgress } from '../../types/streak.types';
import { useStreakPanel } from '../use-streak-panel.hook';

function setup(progress: TodayProgress | undefined) {
  return renderHook(({ value }) => useStreakPanel(value), {
    wrapper: appWrapper(freshStore(), '/'),
    initialProps: { value: progress },
  });
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
    rerender({ value: { done: 1, total: 1 } });
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
});
