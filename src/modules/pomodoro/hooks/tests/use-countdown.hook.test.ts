import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { formatClock, useCountdown } from '../use-countdown.hook';

interface Props {
  remaining: number;
  running: boolean;
}

function setup(initial: Props) {
  return renderHook(({ remaining, running }: Props) => useCountdown(remaining, running), { initialProps: initial });
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useCountdown', () => {
  it('RF-15: parte de remainingSeconds y cuenta hacia atrás mientras está en curso', () => {
    const { result } = setup({ remaining: 1500, running: true });
    expect(result.current).toBe(1500);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current).toBe(1497);
  });

  it('RNF-01: tras un salto largo (pestaña en segundo plano) el valor es exacto, no acumulado', () => {
    const { result } = setup({ remaining: 1500, running: true });
    act(() => {
      jest.advanceTimersByTime(600_000);
    });
    expect(result.current).toBe(900);
  });

  it('RNF-01: no depende de la hora del dispositivo', () => {
    const { result } = setup({ remaining: 1500, running: true });
    act(() => {
      jest.setSystemTime(Date.now() + 3_600_000);
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(1499);
  });

  it('nunca baja de cero', () => {
    const { result } = setup({ remaining: 2, running: true });
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(result.current).toBe(0);
  });

  it('RF-16: en pausa muestra remainingSeconds detenido, sin intervalo', () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const { result } = setup({ remaining: 900, running: false });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(900);
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('al pasar a pausa limpia el intervalo y muestra el tiempo de la API', () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const { result, rerender } = setup({ remaining: 1500, running: true });
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    rerender({ remaining: 1495, running: false });

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(result.current).toBe(1495);
  });

  it('con datos nuevos vuelve a contar desde ellos (cambio de dependencias)', () => {
    const { result, rerender } = setup({ remaining: 1500, running: true });
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    rerender({ remaining: 1200, running: true });
    expect(result.current).toBe(1200);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(1199);
  });

  it('pausar y reanudar seguidos no deja intervalos sueltos', () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const { rerender, unmount } = setup({ remaining: 1500, running: true });
    rerender({ remaining: 1500, running: false });
    rerender({ remaining: 1500, running: true });
    rerender({ remaining: 1500, running: false });
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(setIntervalSpy.mock.calls.length);
  });

  it('limpia el intervalo al desmontar', () => {
    const clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    const { unmount } = setup({ remaining: 1500, running: true });
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });
});

describe('formatClock', () => {
  it.each([
    [1500, '25:00'],
    [61, '01:01'],
    [9, '00:09'],
    [0, '00:00'],
    [7200, '120:00'],
  ])('%i s → %s', (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });
});
