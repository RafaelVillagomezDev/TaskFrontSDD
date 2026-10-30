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

// Capa modal común de Dialog y Drawer: portal en <body>, fondo overlay de DESIGN.md y un <dialog> nativo
// (SonarQube S6819) abierto con `open`, con foco atrapado, Escape y scroll bloqueado propios (useDialogContent)
export function ModalPanel({ state, layerClassName, className, children }: Readonly<ModalPanelProps>) {
  const { containerRef, close } = useDialogContent<HTMLDialogElement>(state);
  if (!state.open) return null;
  return createPortal(
    <div className={cn('fixed inset-0 z-50', layerClassName)}>
      {/* Fondo: entra con un fundido de 150 ms (anim-overlay); el clic cierra y con teclado, Escape */}
      <div
        aria-hidden="true"
        data-testid="modal-overlay"
        className="absolute inset-0 animate-fade-in bg-overlay"
        onClick={close}
      />
      <Box
        as="dialog"
        open
        ref={containerRef}
        aria-modal="true"
        aria-labelledby={state.titleId}
        tabIndex={-1}
        className={cn(
          'm-0 flex flex-col overflow-y-auto overscroll-contain text-foreground shadow-xl focus:outline-none',
          className,
        )}
      >
        {children}
      </Box>
    </div>,
    document.body,
  );
}
