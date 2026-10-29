import type { ReactNode } from 'react';

import { Box } from '../../../shared/ui/box.component';

interface AuthNoticeProps {
  children: ReactNode;
}

// Aviso informativo sobre el formulario (cuenta creada, sesión caducada); <output> lo anuncia como estado (S6819)
export function AuthNotice({ children }: Readonly<AuthNoticeProps>) {
  return (
    <Box as="output" variant="subtle" className="block p-4 text-body-sm">
      {children}
    </Box>
  );
}
