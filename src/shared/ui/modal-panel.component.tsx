import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../utils/class-names.util';
import { Box } from './box.component';
import { useDialogContent, type DialogState } from './use-dialog.hook';

interface ModalPanelProps {
  state: DialogState;
  // Posición del panel en la capa y su forma (centrado en Dialog, lateral en Drawer)
  layerClassName: string;
  className: string;
  children: ReactNode;
}

// Capa modal común de Dialog y Drawer: portal en <body>, fondo overlay de DESIGN.md y panel con rol dialog,
// foco atrapado, Escape y scroll bloqueado (useDialogContent)
export function ModalPanel({ state, layerClassName, className, children }: Readonly<ModalPanelProps>) {
  const { containerRef, close } = useDialogContent<HTMLDivElement>(state);
  if (!state.open) return null;
  return createPortal(
    <div className={cn('fixed inset-0 z-50', layerClassName)}>
      {/* Fondo: el clic cierra; con teclado se cierra con Escape */}
      <div aria-hidden="true" data-testid="modal-overlay" className="absolute inset-0 bg-overlay" onClick={close} />
      <Box
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={state.titleId}
        tabIndex={-1}
        className={cn('flex flex-col overflow-y-auto shadow-xl focus:outline-none', className)}
      >
        {children}
      </Box>
    </div>,
    document.body,
  );
}
