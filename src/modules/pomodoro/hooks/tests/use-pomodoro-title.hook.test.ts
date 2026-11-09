import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { usePomodoroTitle, type TitleState } from '../use-pomodoro-title.hook';

function setup(initial: TitleState) {
  return renderHook(
    (state: TitleState) => {
      usePomodoroTitle(state);
    },
    { initialProps: initial },
  );
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  document.title = 'Kompitu';
});

afterEach(() => {
  setVisibility('visible');
  jest.restoreAllMocks();
});

describe('usePomodoroTitle', () => {
  it('RF-57: en curso muestra el tiempo restante y el nombre de la sección', () => {
    setup({ kind: 'running', seconds: 754 });
    expect(document.title).toBe('12:34 · Pomodoro');
  });

  it('RF-58: en pausa muestra el tiempo detenido y que está en pausa', () => {
    setup({ kind: 'paused', seconds: 754 });
    expect(document.title).toBe('En pausa 12:34 · Pomodoro');
  });

  it('RF-59: al terminar muestra «¡Sesión terminada!» hasta que el usuario vuelve a la pestaña', () => {
    const { rerender } = setup({ kind: 'running', seconds: 1 });
    setVisibility('hidden');
    rerender({ kind: 'ended', sessionId: 'p-1' });
    expect(document.title).toBe('¡Sesión terminada! · Pomodoro');

    act(() => {
      setVisibility('visible');
    });

    expect(document.title).toBe('Kompitu');
  });

  it('RF-59: el fin de la siguiente sesión vuelve a mostrarse aunque el anterior ya se viera', () => {
    const { rerender } = setup({ kind: 'ended', sessionId: 'p-1' });
    act(() => {
      setVisibility('visible');
    });
    rerender({ kind: 'running', seconds: 60 });
    rerender({ kind: 'ended', sessionId: 'p-2' });
    expect(document.title).toBe('¡Sesión terminada! · Pomodoro');
  });

  it('RF-60: sin sesión deja el título normal y al salir de la sección lo restaura', () => {
    const { rerender, unmount } = setup({ kind: 'idle' });
    expect(document.title).toBe('Kompitu');
    rerender({ kind: 'running', seconds: 60 });
    expect(document.title).toBe('01:00 · Pomodoro');
    unmount();
    expect(document.title).toBe('Kompitu');
  });

  it('quita el listener de visibilidad al terminar de esperar y al desmontar', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = setup({ kind: 'ended', sessionId: 'p-1' });
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});
