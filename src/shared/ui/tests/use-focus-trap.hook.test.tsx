import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useFocusTrap } from '../use-focus-trap.hook';
import { useScrollLock } from '../use-scroll-lock.hook';

interface TrapProps {
  active: boolean;
  onEscape: () => void;
}

function Trap({ active, onEscape }: TrapProps) {
  const ref = useFocusTrap<HTMLDivElement>({ active, onEscape });
  return (
    <div ref={ref} tabIndex={-1} aria-label="Zona">
      <button type="button">Primero</button>
      <button type="button" disabled>
        Deshabilitado
      </button>
      <button type="button" tabIndex={-1}>
        Fuera del orden
      </button>
      <button type="button">Último</button>
    </div>
  );
}

function setup(active = true) {
  const onEscape = jest.fn();
  const outside = document.createElement('button');
  outside.textContent = 'Disparador';
  document.body.append(outside);
  outside.focus();
  const view = render(<Trap active={active} onEscape={onEscape} />);
  return { ...view, onEscape, outside };
}

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  jest.restoreAllMocks();
});

describe('useFocusTrap', () => {
  it('al activarse lleva el foco al primer elemento enfocable', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
  });

  it('Tab desde el último vuelve al primero y Shift+Tab desde el primero va al último', async () => {
    const user = userEvent.setup();
    setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
  });

  it('si el foco se ha ido fuera, Tab lo devuelve dentro', () => {
    const { outside } = setup();
    outside.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
  });

  it('Escape llama a onEscape', async () => {
    const user = userEvent.setup();
    const { onEscape } = setup();
    await user.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('inactivo no mueve el foco ni escucha el teclado', () => {
    const { outside, onEscape } = setup(false);
    expect(outside).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('sin elementos enfocables enfoca el propio contenedor', () => {
    function Empty() {
      const ref = useFocusTrap<HTMLDivElement>({ active: true, onEscape: () => undefined });
      return <div ref={ref} tabIndex={-1} aria-label="Vacía" />;
    }
    render(<Empty />);
    expect(screen.getByLabelText('Vacía')).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByLabelText('Vacía')).toHaveFocus();
  });
});

describe('IV.3: limpieza y carreras de useFocusTrap', () => {
  it('al desmontar quita el listener y devuelve el foco al disparador', () => {
    const removeListener = jest.spyOn(document, 'removeEventListener');
    const { unmount, outside, onEscape } = setup();
    unmount();
    expect(removeListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(outside).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('al desactivarse devuelve el foco y deja de escuchar', () => {
    const { rerender, outside, onEscape } = setup();
    rerender(<Trap active={false} onEscape={onEscape} />);
    expect(outside).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('un onEscape nuevo no reinicia la trampa ni roba el foco, y se usa el último', () => {
    const { rerender, onEscape } = setup();
    screen.getByRole('button', { name: 'Último' }).focus();
    const latest = jest.fn();
    rerender(<Trap active onEscape={latest} />);
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(latest).toHaveBeenCalledTimes(1);
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('activar y desactivar varias veces seguidas deja un solo listener', () => {
    const addListener = jest.spyOn(document, 'addEventListener');
    const removeListener = jest.spyOn(document, 'removeEventListener');
    const { rerender, onEscape } = setup();
    rerender(<Trap active={false} onEscape={onEscape} />);
    rerender(<Trap active onEscape={onEscape} />);
    rerender(<Trap active={false} onEscape={onEscape} />);
    rerender(<Trap active onEscape={onEscape} />);
    const keydownAdds = addListener.mock.calls.filter(([type]) => type === 'keydown').length;
    const keydownRemoves = removeListener.mock.calls.filter(([type]) => type === 'keydown').length;
    expect(keydownAdds - keydownRemoves).toBe(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});

describe('useScrollLock', () => {
  function Lock({ active }: { active: boolean }) {
    useScrollLock(active);
    return null;
  }

  it('bloquea el scroll de la página mientras está activo y lo libera al desmontar', () => {
    const { unmount } = render(<Lock active />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('inactivo no toca el scroll y al desactivarse lo libera', () => {
    const { rerender } = render(<Lock active={false} />);
    expect(document.body.style.overflow).toBe('');
    rerender(<Lock active />);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Lock active={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('dos bloqueos anidados: cerrar el interior mantiene el exterior', () => {
    const outer = render(<Lock active />);
    const inner = render(<Lock active />);
    inner.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    outer.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('respeta el valor previo del body', () => {
    document.body.style.overflow = 'scroll';
    const { unmount } = render(<Lock active />);
    unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });
});
