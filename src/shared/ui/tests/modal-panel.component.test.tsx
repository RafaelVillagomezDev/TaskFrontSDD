import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ModalPanel } from '../modal-panel.component';
import type { DialogState } from '../use-dialog.hook';

function state(open: boolean, setOpen = jest.fn()): DialogState {
  return { open, setOpen, titleId: 'titulo' };
}

describe('ModalPanel', () => {
  it('cerrado no pinta nada', () => {
    render(
      <ModalPanel state={state(false)} layerClassName="" className="">
        Contenido
      </ModalPanel>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abierto pinta en <body> un panel modal nombrado por su título, con las clases de cada capa', () => {
    const { container } = render(
      <ModalPanel state={state(true)} layerClassName="items-center" className="bg-surface">
        <h2 id="titulo">Título</h2>
      </ModalPanel>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Título' });
    expect(container).not.toContainElement(dialog);
    expect(dialog.className).toContain('bg-surface');
    expect(dialog.className).toContain('shadow-xl');
    // Su scroll no se encadena a la página de detrás
    expect(dialog.className).toContain('overscroll-contain');
    expect(dialog.parentElement?.className).toContain('items-center');
  });

  it('el fondo pide cerrar', async () => {
    const user = userEvent.setup();
    const setOpen = jest.fn();
    render(
      <ModalPanel state={state(true, setOpen)} layerClassName="" className="">
        Contenido
      </ModalPanel>,
    );
    await user.click(screen.getByTestId('modal-overlay'));
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
