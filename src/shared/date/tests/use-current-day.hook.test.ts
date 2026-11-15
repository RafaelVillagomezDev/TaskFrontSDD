import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { msUntilNextMidnight, useCurrentDay } from '../use-current-day.hook';

const LAST_MINUTE = new Date(2026, 9, 29, 23, 59, 0);
const ONE_MINUTE = 60_000;

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  jest.useFakeTimers({ now: LAST_MINUTE });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('msUntilNextMidnight', () => {
  it('cuenta hasta la medianoche local', () => {
    expect(msUntilNextMidnight(LAST_MINUTE)).toBe(ONE_MINUTE);
  });
});

describe('RF-14: useCurrentDay', () => {
  it('devuelve el día actual del dispositivo', () => {
    const { result } = renderHook(() => useCurrentDay());
    expect(result.current).toBe('2026-10-29');
  });

  it('cambia de día a medianoche', () => {
    const { result } = renderHook(() => useCurrentDay());
    act(() => {
      jest.advanceTimersByTime(ONE_MINUTE);
    });
    expect(result.current).toBe('2026-10-30');
  });

  it('cambia de día al volver a la pestaña si el reloj ha pasado la medianoche sin temporizadores', () => {
    const { result } = renderHook(() => useCurrentDay());
    jest.setSystemTime(new Date(2026, 9, 30, 8, 0, 0));
    act(() => {
      setVisibility('visible');
    });
    expect(result.current).toBe('2026-10-30');
  });

  it('cambia de día al recuperar el foco', () => {
    const { result } = renderHook(() => useCurrentDay());
    jest.setSystemTime(new Date(2026, 9, 31, 8, 0, 0));
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current).toBe('2026-10-31');
  });

  it('no cambia al ocultar la pestaña', () => {
    const { result } = renderHook(() => useCurrentDay());
    jest.setSystemTime(new Date(2026, 9, 30, 8, 0, 0));
    act(() => {
      setVisibility('hidden');
    });
    expect(result.current).toBe('2026-10-29');
  });

  it('sigue cambiando cada medianoche, no solo la primera', () => {
    const { result } = renderHook(() => useCurrentDay());
    act(() => {
      jest.advanceTimersByTime(ONE_MINUTE + 24 * 60 * ONE_MINUTE);
    });
    expect(result.current).toBe('2026-10-31');
  });
});

describe('IV.3: limpieza y carreras de useCurrentDay', () => {
  it('al desmontar elimina el temporizador y los listeners', () => {
    const removeDocumentListener = jest.spyOn(document, 'removeEventListener');
    const removeWindowListener = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useCurrentDay());
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
    expect(removeDocumentListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith('focus', expect.any(Function));
  });

  it('no actualiza nada después de desmontar, aunque pase la medianoche o vuelva el foco', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result, unmount } = renderHook(() => useCurrentDay());
    unmount();
    act(() => {
      jest.advanceTimersByTime(ONE_MINUTE);
      window.dispatchEvent(new Event('focus'));
    });
    expect(result.current).toBe('2026-10-29');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('con varios eventos seguidos mantiene un solo temporizador y el último día', () => {
    const { result } = renderHook(() => useCurrentDay());
    jest.setSystemTime(new Date(2026, 9, 30, 8, 0, 0));
    act(() => {
      setVisibility('visible');
      window.dispatchEvent(new Event('focus'));
      setVisibility('visible');
    });
    expect(jest.getTimerCount()).toBe(1);
    expect(result.current).toBe('2026-10-30');
  });
});
