import type { ReactNode } from 'react';

interface NavbarProps {
  children: ReactNode;
}

// Barra superior de DESIGN.md: 64 px, superficie de página y divisor de 1 px abajo
export function Navbar({ children }: Readonly<NavbarProps>) {
  return (
    <header className="sticky top-0 z-40 flex h-navbar shrink-0 items-center gap-4 border-b border-border bg-page px-4 md:px-8">
      {children}
    </header>
  );
}
