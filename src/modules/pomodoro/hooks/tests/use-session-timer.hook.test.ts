import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { pomodoroFixture } from '../../tests/pomodoro.fixtures';
import type { SessionView } from '../use-active-session.hook';
import { useSessionTimer } from '../use-session-timer.hook';

interface Props {
  view: SessionView;
  refresh: () => Promise<boolean>;
}

function setup(initial: Props) {
  return renderHook((props: Props) => useSessionTimer(props), { initialProps: initial });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  document.title = 'Kompitu';
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('useSessionTimer', () => {
  it('RF-15 y RF-57: cuenta atrás de la sesión en curso y su tiempo en el título', () => {
    const view: SessionView = { kind: 'session', session: pomodoroFixture({ remainingSeconds: 754 }) };
    const { result } = setup({ view, refresh: jest.fn(() => Promise.resolve(true)) });
    expect(result.current.seconds).toBe(754);
    expect(document.title).toBe('12:34 · Pomodoro');
  });

  it('RF-17 y RF-66: al llegar a cero vuelve a consultar la sesión y anuncia el fin', async () => {
    const refresh = jest.fn(() => Promise.resolve(false));
    const view: SessionView = { kind: 'session', session: pomodoroFixture({ remainingSeconds: 2 }) };
    const { result } = setup({ view, refresh });

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    await flush();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.timerMessage).toBe('La sesión ha terminado.');
  });

  it('RF-59: el resultado de la sesión que terminó en la página cambia el título; uno recargado no', async () => {
    const refresh = jest.fn(() => Promise.resolve(false));
    const running: SessionView = { kind: 'session', session: pomodoroFixture({ remainingSeconds: 1 }) };
    const { rerender } = setup({ view: running, refresh });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await flush();

    rerender({ view: { kind: 'result', id: 'p-1', session: undefined }, refresh });
    expect(document.title).toBe('¡Sesión terminada! · Pomodoro');

    rerender({ view: { kind: 'result', id: 'p-9', session: undefined }, refresh });
    expect(document.title).toBe('Kompitu');
  });

  it('RF-16 y RF-58: en pausa la cuenta atrás no avanza y el título lo indica', () => {
    const view: SessionView = { kind: 'session', session: pomodoroFixture({ status: 'paused', remainingSeconds: 60 }) };
    const { result } = setup({ view, refresh: jest.fn(() => Promise.resolve(true)) });
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.seconds).toBe(60);
    expect(document.title).toBe('En pausa 01:00 · Pomodoro');
  });

  it('RF-60: sin sesión deja el título normal', () => {
    setup({ view: { kind: 'form' }, refresh: jest.fn(() => Promise.resolve(false)) });
    expect(document.title).toBe('Kompitu');
  });
});
