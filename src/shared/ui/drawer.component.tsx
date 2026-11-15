import type { ReactNode } from 'react';

import { Button, type ButtonProps } from './button.component';
import { ModalPanel } from './modal-panel.component';
import { Text } from './text.component';
import { useDialog, type DialogOptions } from './use-dialog.hook';
import { drawerContext } from './use-drawer.hook';

const { Context: DrawerContext, usePart } = drawerContext;

interface DrawerProps extends DialogOptions {
  children: ReactNode;
}

interface DrawerPartProps {
  children: ReactNode;
}

function DrawerRoot({ children, ...options }: Readonly<DrawerProps>) {
  const drawer = useDialog(options);
  return <DrawerContext value={drawer}>{children}</DrawerContext>;
}

function DrawerTrigger(props: Readonly<ButtonProps>) {
  const { open, setOpen } = usePart('Trigger');
  return (
    <Button
      {...props}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        setOpen(true);
      }}
    />
  );
}

// Panel lateral izquierdo con el ancho del Sidebar de DESIGN.md y la superficie del shell (Layout Patterns);
// nunca más ancho que la pantalla (CONSTITUTION.md VII.6). Entra desde su borde (anim-drawer)
function DrawerContent({ children }: Readonly<DrawerPartProps>) {
  const drawer = usePart('Content');
  return (
    <ModalPanel
      state={drawer}
      layerClassName=""
      className="absolute inset-y-0 right-auto left-0 h-full max-h-full w-sidebar max-w-full animate-slide-in-left gap-6 border-r border-border bg-page p-4"
    >
      {children}
    </ModalPanel>
  );
}

function DrawerTitle({ children }: Readonly<DrawerPartProps>) {
  const { titleId } = usePart('Title');
  return (
    <Text as="h2" variant="h4" id={titleId}>
      {children}
    </Text>
  );
}

function DrawerClose(props: Readonly<ButtonProps>) {
  const { setOpen } = usePart('Close');
  return (
    <Button
      {...props}
      onClick={() => {
        setOpen(false);
      }}
    />
  );
}

// Compound component (CONSTITUTION.md VI.2): Drawer.Trigger, .Content, .Title y .Close
export const Drawer = Object.assign(DrawerRoot, {
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Title: DrawerTitle,
  Close: DrawerClose,
});
