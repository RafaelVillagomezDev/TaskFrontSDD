import type { ReactNode } from 'react';

import { Box } from '../ui/box.component';

interface EmptyStateProps {
  children: ReactNode;
}

// Estado vacío de una zona (sin tareas, sin avisos…): el contenido llega por children. Borde discontinuo y sin
// relleno, para que pese menos que el contenido real (DESIGN.md Layout Patterns)
export function EmptyState({ children }: Readonly<EmptyStateProps>) {
  return (
    <Box className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border p-8 text-center text-foreground-muted">
      {children}
    </Box>
  );
}
