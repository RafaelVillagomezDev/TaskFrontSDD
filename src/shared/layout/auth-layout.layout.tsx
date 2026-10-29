import type { ReactNode } from 'react';

import { NAVIGATION_TEXTS } from '../texts/navigation.texts';
import { Box } from '../ui/box.component';
import { Text } from '../ui/text.component';

interface AuthLayoutProps {
  children: ReactNode;
}

// Pantallas de inicio de sesión y registro: la marca (S-09) y una tarjeta centrada de ancho fluido
export function AuthLayout({ children }: Readonly<AuthLayoutProps>) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-page p-4">
      <Text as="p" variant="h3" tone="primary">
        {NAVIGATION_TEXTS.appName}
      </Text>
      <Box variant="card" className="flex w-full max-w-dialog flex-col gap-6">
        {children}
      </Box>
    </main>
  );
}
