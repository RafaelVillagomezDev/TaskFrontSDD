import { act, renderHook } from '@testing-library/react';

import { milestoneMessage, minutesLeft, useCountdownAnnouncer } from '../use-countdown-announcer.hook';

describe('milestoneMessage', () => {
  it.each([
    [1500, 1500, ''],
    [301, 1500, ''],
    [300, 1500, 'Quedan 5 minutos.'],
    [61, 1500, 'Quedan 5 minutos.'],
    [60, 1500, 'Queda 1 minuto.'],
    [1, 1500, 'Queda 1 minuto.'],
    [0, 1500, ''],
  ])('RF-64: con %i s de %i anuncia «%s»', (seconds, base, message) => {
    expect(milestoneMessage(seconds, base, true)).toBe(message);
  });

  it('RF-65: una sesión de 3 minutos no anuncia «quedan 5 minutos» pero sí «queda 1 minuto»', () => {
    expect(milestoneMessage(180, 180, true)).toBe('');
    expect(milestoneMessage(60, 180, true)).toBe('Queda 1 minuto.');
  });

  it('RF-65: una sesión de 1 minuto no anuncia ningún hito', () => {
    expect(milestoneMessage(60, 60, true)).toBe('');
    expect(milestoneMessage(30, 60, true)).toBe('');
  });

  it('RF-65: al reanudar con 4 minutos no anuncia «quedan 5 minutos»', () => {
    expect(milestoneMessage(240, 240, true)).toBe('');
  });

  it('RNF-02: en pausa no anuncia hitos', () => {
    expect(milestoneMessage(300, 1500, false)).toBe('');
  });
});

describe('useCountdownAnnouncer', () => {
  it('RF-63: anuncia empezar, pausar y reanudar con los minutos que quedan', () => {
    const { result } = renderHook(() => useCountdownAnnouncer());
    expect(result.current.actionMessage).toBe('');
    act(() => {
      result.current.announceAction('started', 1500);
    });
    expect(result.current.actionMessage).toBe('Sesión empezada. Quedan 25 minutos.');
    act(() => {
      result.current.announceAction('paused', 754);
    });
    expect(result.current.actionMessage).toBe('Sesión en pausa. Quedan 13 minutos.');
    act(() => {
      result.current.announceAction('resumed', 30);
    });
    expect(result.current.actionMessage).toBe('Sesión reanudada. Queda 1 minuto.');
  });

  it('RF-66: tras el fin el temporizador anuncia que ha terminado; una nueva acción lo borra', () => {
    const { result } = renderHook(() => useCountdownAnnouncer());
    expect(result.current.timerMessage(300, 1500, true)).toBe('Quedan 5 minutos.');
    act(() => {
      result.current.announceEnd();
    });
    expect(result.current.timerMessage(0, 1500, false)).toBe('La sesión ha terminado.');
    act(() => {
      result.current.announceAction('started', 1500);
    });
    expect(result.current.timerMessage(1500, 1500, true)).toBe('');
  });
});

describe('minutesLeft', () => {
  it.each([
    [1500, 25],
    [61, 2],
    [30, 1],
  ])('%i s → %i min (hacia arriba)', (seconds, minutes) => {
    expect(minutesLeft(seconds)).toBe(minutes);
  });
});
