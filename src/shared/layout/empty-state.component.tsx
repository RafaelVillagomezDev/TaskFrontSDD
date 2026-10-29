import type { ReactNode } from 'react';

import { Box } from '../ui/box.component';

interface EmptyStateProps {
  children: ReactNode;
}

// Estado vacío de una zona (sin tareas, sin avisos…): el contenido llega por children
export function EmptyState({ children }: Readonly<EmptyStateProps>) {
  return (
    <Box variant="subtle" className="flex flex-col items-center gap-3 p-8 text-center text-foreground-muted">
      {children}
    </Box>
  );
}
