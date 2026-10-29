import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Drawer } from '../drawer.component';

function NavDrawer(props: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <Drawer {...props}>
      <Drawer.Trigger variant="ghost">Menú</Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Title>Navegación</Drawer.Title>
        <Drawer.Close variant="ghost">Cerrar menú</Drawer.Close>
        <a href="#historial">Historial</a>
      </Drawer.Content>
    </Drawer>
  );
}

async function openDrawer() {
  const user = userEvent.setup();
  render(<NavDrawer />);
  await user.click(screen.getByRole('button', { name: 'Menú' }));
  return user;
}

afterEach(() => {
  document.body.style.overflow = '';
  jest.restoreAllMocks();
});

describe('VI.2: Drawer compound', () => {
  it.each(['Trigger', 'Content', 'Title', 'Close'] as const)('Drawer.%s fuera de <Drawer> lanza un error', (part) => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const Part = Drawer[part];
    expect(() => render(<Part>x</Part>)).toThrow(`<Drawer.${part}> debe usarse dentro de <Drawer>`);
  });

  it('cerrado no pinta el panel; el disparador indica que abre un diálogo', () => {
    render(<NavDrawer />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menú' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('RF-50: al abrir es un panel modal lateral con nombre accesible y el foco dentro', async () => {
    await openDrawer();
    const drawer = screen.getByRole('dialog', { name: 'Navegación' });
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer.className).toContain('w-sidebar');
    expect(drawer.className).toContain('max-w-full');
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
  });

  it('Escape cierra y el foco vuelve al disparador', async () => {
    const user = await openDrawer();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menú' })).toHaveFocus();
  });

  it('el foco queda atrapado dentro con Tab', async () => {
    const user = await openDrawer();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Historial' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
  });

  it('se cierra con Drawer.Close y con el fondo', async () => {
    const user = await openDrawer();
    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Menú' }));
    await user.click(screen.getByTestId('modal-overlay'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('bloquea el scroll mientras está abierto y lo libera al cerrar y al desmontar', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<NavDrawer />);
    await user.click(screen.getByRole('button', { name: 'Menú' }));
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('');

    await user.click(screen.getByRole('button', { name: 'Menú' }));
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('controlado: respeta open y avisa con onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<NavDrawer open onOpenChange={onOpenChange} />);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
