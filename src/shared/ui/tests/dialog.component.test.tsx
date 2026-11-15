import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Dialog } from '../dialog.component';

function DeleteDialog(props: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog {...props}>
      <Dialog.Trigger variant="destructive">Eliminar</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>¿Eliminar la tarea?</Dialog.Title>
        <p>No se puede deshacer.</p>
        <Dialog.Actions>
          <Dialog.Close variant="secondary">Cancelar</Dialog.Close>
          <button type="button">Confirmar</button>
        </Dialog.Actions>
      </Dialog.Content>
    </Dialog>
  );
}

async function openDialog() {
  const user = userEvent.setup();
  render(<DeleteDialog />);
  await user.click(screen.getByRole('button', { name: 'Eliminar' }));
  return user;
}

afterEach(() => {
  document.body.style.overflow = '';
  jest.restoreAllMocks();
});

describe('VI.2: Dialog compound', () => {
  it.each(['Trigger', 'Content', 'Title', 'Close'] as const)('Dialog.%s fuera de <Dialog> lanza un error', (part) => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const Part = Dialog[part];
    expect(() => render(<Part>x</Part>)).toThrow(`<Dialog.${part}> debe usarse dentro de <Dialog>`);
  });

  it('cerrado no pinta el contenido; el disparador indica que abre un diálogo', () => {
    render(<DeleteDialog />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Eliminar' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('RF-23: al abrir es un diálogo modal con nombre accesible y el foco dentro', async () => {
    await openDialog();
    const dialog = screen.getByRole('dialog', { name: '¿Eliminar la tarea?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('usa los tokens de DESIGN.md: radius-lg, shadow-xl, ancho máximo y overlay', async () => {
    await openDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('rounded-lg');
    expect(dialog.className).toContain('shadow-xl');
    expect(dialog.className).toContain('max-w-dialog');
    // anim-modal: entra desde scale(0.95) y transparente en 200 ms, centrado; el fondo, con un fundido
    expect(dialog.className).toContain('animate-scale-in');
    expect(screen.getByTestId('modal-overlay').className).toContain('animate-fade-in');
    expect(dialog.className).toContain('w-full');
    expect(document.querySelector('.bg-overlay')).not.toBeNull();
  });

  it('Escape cierra y el foco vuelve al disparador', async () => {
    const user = await openDialog();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveFocus();
  });

  it('el foco queda atrapado dentro con Tab', async () => {
    const user = await openDialog();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Confirmar' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('Dialog.Close y el clic en el fondo cierran', async () => {
    const user = await openDialog();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await user.click(screen.getByTestId('modal-overlay'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('bloquea el scroll de la página mientras está abierto y lo libera al cerrar y al desmontar', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<DeleteDialog />);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('controlado: respeta open y avisa con onOpenChange sin cerrarse solo', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<DeleteDialog open onOpenChange={onOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
