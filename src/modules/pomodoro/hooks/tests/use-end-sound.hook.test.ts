import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import { useEndSound } from '../use-end-sound.hook';

// AudioContext simulado (jsdom no tiene Web Audio): registra los tonos y si se cerró
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  static startState: AudioContextState = 'running';
  state: AudioContextState = FakeAudioContext.startState;
  currentTime = 0;
  destination = {};
  tones = 0;
  close = jest.fn(() => Promise.resolve());
  resume = jest.fn(() => Promise.resolve());

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    return {
      frequency: { value: 0 },
      connect: (node: unknown) => node,
      start: () => {
        this.tones += 1;
      },
      stop: jest.fn(),
    };
  }

  createGain() {
    return { gain: { value: 0 }, connect: (node: unknown) => node };
  }
}

beforeEach(() => {
  FakeAudioContext.instances = [];
  FakeAudioContext.startState = 'running';
  Object.defineProperty(globalThis, 'AudioContext', { value: FakeAudioContext, configurable: true, writable: true });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'AudioContext');
});

function lastContext(): FakeAudioContext | undefined {
  return FakeAudioContext.instances.at(-1);
}

describe('useEndSound', () => {
  it('RF-19: tras preparar el sonido en un gesto, al terminar suena un tono', () => {
    const { result } = renderHook(() => useEndSound());
    act(() => {
      result.current.prime();
    });
    act(() => {
      result.current.play();
    });
    expect(lastContext()?.tones).toBe(1);
  });

  it('RF-61: silenciado no suena; volver a activarlo lo recupera', () => {
    const { result } = renderHook(() => useEndSound());
    act(() => {
      result.current.prime();
      result.current.toggleMuted();
    });
    expect(result.current.muted).toBe(true);
    act(() => {
      result.current.play();
    });
    expect(lastContext()?.tones).toBe(0);

    act(() => {
      result.current.toggleMuted();
    });
    act(() => {
      result.current.play();
    });
    expect(lastContext()?.tones).toBe(1);
  });

  it('RF-62: sin gesto previo (tras recargar) no suena ni lanza error', () => {
    const { result } = renderHook(() => useEndSound());
    expect(() => {
      act(() => {
        result.current.play();
      });
    }).not.toThrow();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it('RF-62: con el audio bloqueado por el navegador (suspended) no suena', () => {
    FakeAudioContext.startState = 'suspended';
    const { result } = renderHook(() => useEndSound());
    act(() => {
      result.current.prime();
    });
    act(() => {
      result.current.play();
    });
    expect(lastContext()?.resume).toHaveBeenCalled();
    expect(lastContext()?.tones).toBe(0);
  });

  it('RF-62: en un navegador sin Web Audio no hace nada', () => {
    Reflect.deleteProperty(globalThis, 'AudioContext');
    const { result } = renderHook(() => useEndSound());
    expect(() => {
      act(() => {
        result.current.prime();
        result.current.play();
      });
    }).not.toThrow();
  });

  it('reutiliza el mismo contexto en varios gestos y lo cierra al desmontar', () => {
    const { result, unmount } = renderHook(() => useEndSound());
    act(() => {
      result.current.prime();
      result.current.prime();
    });
    expect(FakeAudioContext.instances).toHaveLength(1);
    unmount();
    expect(lastContext()?.close).toHaveBeenCalledTimes(1);
  });
});
