import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import type { BaseSyntheticEvent } from 'react';

import { useSingleSubmit } from '../use-single-submit.hook';

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function fakeEvent() {
  const preventDefault = jest.fn();
  const event: BaseSyntheticEvent = { preventDefault } as unknown as BaseSyntheticEvent;
  return { event, preventDefault };
}

describe('RF-19: useSingleSubmit', () => {
  it('descarta los envíos que llegan mientras otro está en curso', async () => {
    const pending = deferred();
    const submit = jest.fn(() => pending.promise);
    const { result } = renderHook(() => useSingleSubmit(submit));

    act(() => {
      result.current();
      result.current();
      result.current();
    });
    expect(submit).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    act(() => {
      result.current();
    });
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('evita el envío nativo del formulario también en los envíos descartados', () => {
    const submit = jest.fn(() => new Promise<void>(() => undefined));
    const { result } = renderHook(() => useSingleSubmit(submit));
    const first = fakeEvent();
    const second = fakeEvent();
    act(() => {
      result.current(first.event);
      result.current(second.event);
    });
    expect(first.preventDefault).toHaveBeenCalled();
    expect(second.preventDefault).toHaveBeenCalled();
    expect(submit).toHaveBeenCalledWith(first.event);
  });
});
