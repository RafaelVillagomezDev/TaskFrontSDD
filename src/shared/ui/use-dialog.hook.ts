import { useCallback, useId, useState, type RefObject } from 'react';

import { createCompoundContext } from './compound-context.util';
import { useFocusTrap } from './use-focus-trap.hook';
import { useScrollLock } from './use-scroll-lock.hook';

export interface DialogOptions {
  // Controlado: el padre decide si está abierto y recibe los cambios en onOpenChange
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface DialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
}

// Estado de apertura de un modal, controlado o no. Lo comparten Dialog y Drawer
export function useDialog({ open, defaultOpen = false, onOpenChange }: DialogOptions): DialogState {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const titleId = useId();
  const isControlled = open !== undefined;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return { open: open ?? uncontrolledOpen, setOpen, titleId };
}

export interface DialogContentBehavior<T extends HTMLElement> {
  containerRef: RefObject<T | null>;
  close: () => void;
}

// Comportamiento del panel abierto: foco atrapado, Escape cierra y scroll de la página bloqueado
export function useDialogContent<T extends HTMLElement>({ open, setOpen }: DialogState): DialogContentBehavior<T> {
  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  const containerRef = useFocusTrap<T>({ active: open, onEscape: close });
  useScrollLock(open);
  return { containerRef, close };
}

// Contexto interno del compound Dialog (CONSTITUTION.md V, excepción VI.2): solo lo usa dialog.component.tsx
export const dialogContext = createCompoundContext<DialogState>('Dialog');
