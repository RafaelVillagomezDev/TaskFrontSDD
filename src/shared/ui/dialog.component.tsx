import type { ReactNode } from 'react';

import { Button, type ButtonProps } from './button.component';
import { ModalPanel } from './modal-panel.component';
import { Text } from './text.component';
import { dialogContext, useDialog, type DialogOptions } from './use-dialog.hook';

const { Context: DialogContext, usePart } = dialogContext;

interface DialogProps extends DialogOptions {
  children: ReactNode;
}

interface DialogPartProps {
  children: ReactNode;
}

function DialogRoot({ children, ...options }: Readonly<DialogProps>) {
  const dialog = useDialog(options);
  return <DialogContext value={dialog}>{children}</DialogContext>;
}

function DialogTrigger(props: Readonly<ButtonProps>) {
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

// Modal centrado según DESIGN.md: radius-lg, shadow-xl, space-6 y ancho máximo container-dialog.
// En móvil ocupa el ancho disponible (CONSTITUTION.md VII.6)
function DialogContent({ children }: Readonly<DialogPartProps>) {
  const dialog = usePart('Content');
  return (
    <ModalPanel
      state={dialog}
      layerClassName="flex items-center justify-center p-4"
      className="relative max-h-full w-full max-w-dialog animate-scale-in gap-6 rounded-lg bg-surface p-6"
    >
      {children}
    </ModalPanel>
  );
}

function DialogTitle({ children }: Readonly<DialogPartProps>) {
  const { titleId } = usePart('Title');
  return (
    <Text as="h2" variant="h3" id={titleId}>
      {children}
    </Text>
  );
}

// Fila de acciones: en móvil se apilan a ancho completo, desde sm se alinean a la derecha
function DialogActions({ children }: Readonly<DialogPartProps>) {
  return <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{children}</div>;
}

function DialogClose(props: Readonly<ButtonProps>) {
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

// Compound component (CONSTITUTION.md VI.2): Dialog.Trigger, .Content, .Title, .Actions y .Close
export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Title: DialogTitle,
  Actions: DialogActions,
  Close: DialogClose,
});
