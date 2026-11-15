import { createCompoundContext } from './compound-context.util';
import type { DialogState } from './use-dialog.hook';

// Contexto interno del compound Drawer (CONSTITUTION.md V, excepción VI.2): solo lo usa drawer.component.tsx.
// El estado y el comportamiento del panel (foco, Escape, scroll) son los de Dialog: useDialog y useDialogContent
export const drawerContext = createCompoundContext<DialogState>('Drawer');
