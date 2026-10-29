import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

// Estructura de las pantallas privadas (DESIGN.md Layout Patterns, App Shell): una sola superficie de página.
// Mobile-first: en móvil y tablet solo la columna de contenido; desde lg, el Sidebar a la izquierda (plan D-12)
function AppShellRoot({ children }: Readonly<AppShellProps>) {
  return <div className="flex min-h-dvh bg-page">{children}</div>;
}

// Columna derecha: Navbar arriba y el contenido debajo; min-w-0 evita que el tablero ensanche la página (VII.5)
function AppShellBody({ children }: Readonly<AppShellProps>) {
  return <div className="flex min-w-0 flex-1 flex-col">{children}</div>;
}

export const AppShell = Object.assign(AppShellRoot, { Body: AppShellBody });
