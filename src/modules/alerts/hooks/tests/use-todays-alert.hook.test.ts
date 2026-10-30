import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { appWrapper, freshStore } from '../../../../../jest/render-app';
import { useTodaysAlert } from '../use-todays-alert.hook';

const NOON = new Date(2026, 9, 29, 12, 0, 0);

function alertCreatedAt(createdAt: Date) {
  return {
    id: 'al1',
    type: 'daily',
    periodStart: '2026-10-28',
    periodEnd: '2026-10-28',
    tasks: [{ id: 't1', title: 'Llamar al banco', date: '2026-10-28' }],
    createdAt: createdAt.toISOString(),
  };
}

function latest(items: unknown[]) {
  return () => apiOk({ items, page: 1, pageSize: 1, totalItems: items.length, totalPages: items.length });
}

function setup() {
  return renderHook(() => useTodaysAlert(), { wrapper: appWrapper(freshStore(), '/') });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOON, advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useTodaysAlert', () => {
  it('RF-37: destaca el aviso más reciente si se generó hoy en la fecha local', async () => {
    const api = mockApi({ 'GET /alerts': latest([alertCreatedAt(new Date(2026, 9, 29, 0, 30))]) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current?.id).toBe('al1');
    });
    expect(api.requests).toHaveLength(1);
  });

  it('S-05: uno generado ayer a las 22:00 no se destaca', async () => {
    const api = mockApi({ 'GET /alerts': latest([alertCreatedAt(new Date(2026, 9, 28, 22, 0))]) });
    const { result } = setup();
    await waitFor(() => {
      expect(api.requests).toHaveLength(1);
    });
    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });

  it('RF-37: sin avisos no destaca nada', async () => {
    const api = mockApi({ 'GET /alerts': latest([]) });
    const { result } = setup();
    await waitFor(() => {
      expect(api.requests).toHaveLength(1);
    });
    expect(result.current).toBeUndefined();
  });

  it('si la consulta falla no destaca nada', async () => {
    const api = mockApi({ 'GET /alerts': () => apiFail(500, 'INTERNAL_ERROR') });
    const { result } = setup();
    await waitFor(() => {
      expect(api.requests.length).toBeGreaterThan(0);
    });
    expect(result.current).toBeUndefined();
  });

  it('RF-37: al llegar la medianoche deja de destacarse', async () => {
    mockApi({ 'GET /alerts': latest([alertCreatedAt(new Date(2026, 9, 29, 0, 30))]) });
    const { result } = setup();
    await waitFor(() => {
      expect(result.current?.id).toBe('al1');
    });
    act(() => {
      jest.setSystemTime(new Date(2026, 9, 30, 0, 1));
      jest.advanceTimersByTime(12 * 60 * 60 * 1000);
    });
    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });
});
