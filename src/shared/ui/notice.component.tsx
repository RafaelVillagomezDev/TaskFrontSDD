import type { ReactNode } from 'react';

import { Box } from './box.component';

interface NoticeProps {
  children: ReactNode;
}

// Aviso informativo de una zona (cuenta creada, sesión caducada, tarea creada fuera de la semana);
// <output> lo anuncia como estado (SonarQube S6819)
export function Notice({ children }: Readonly<NoticeProps>) {
  return (
    <Box as="output" variant="subtle" className="block p-4 text-body-sm">
      {children}
    </Box>
  );
}
