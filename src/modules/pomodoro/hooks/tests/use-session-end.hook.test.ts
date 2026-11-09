import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { useSessionEnd, type SessionEndOptions } from '../use-session-end.hook';

function setup(initial: SessionEndOptions) {
  return renderHook(
    (options: SessionEndOptions) => {
      useSessionEnd(options);
    },
    { initialProps: initial },
  );
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useSessionEnd', () => {
  it('RF-17: sin llegar a cero no avisa ni consulta', async () => {
    const refresh = jest.fn(() => Promise.resolve(false));
    const onEnd = jest.fn();
    setup({ reachedZero: false, refresh, onEnd });
    await flush();
    expect(onEnd).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it('RF-17: al llegar a cero avisa una vez y vuelve a consultar la sesión', async () => {
    const refresh = jest.fn(() => Promise.resolve(false));
    const onEnd = jest.fn();
    const { rerender } = setup({ reachedZero: true, refresh, onEnd });
    await flush();
    rerender({ reachedZero: true, refresh: jest.fn(() => Promise.resolve(false)), onEnd: jest.fn() });
    await flush();

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('RF-18: si la API aún la da por activa, repite la consulta una sola vez tras un segundo', async () => {
    const refresh = jest.fn(() => Promise.resolve(true));
    setup({ reachedZero: true, refresh, onEnd: jest.fn() });
    await flush();
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(refresh).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(refresh).toHaveBeenCalledTimes(2);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('desmontar antes del reintento lo cancela (clearTimeout)', async () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');
    const refresh = jest.fn(() => Promise.resolve(true));
    const { unmount } = setup({ reachedZero: true, refresh, onEnd: jest.fn() });
    await flush();

    unmount();
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('desmontar antes de que responda la consulta no programa el reintento', async () => {
    let answer: (stillActive: boolean) => void = () => undefined;
    const refresh = jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          answer = resolve;
        }),
    );
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const { unmount } = setup({ reachedZero: true, refresh, onEnd: jest.fn() });
    await flush();

    unmount();
    answer(true);
    await flush();

    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 1000);
  });
});
