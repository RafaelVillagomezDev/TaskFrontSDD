import type { ReactNode } from 'react';

interface SidebarProps {
  children: ReactNode;
}

// Sidebar de DESIGN.md (240 px, superficie de página y divisor de 1 px a la derecha), visible solo desde lg;
// por debajo la navegación va en un Drawer (plan §6.2)
export function Sidebar({ children }: Readonly<SidebarProps>) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-page p-4 lg:flex">
      {children}
    </aside>
  );
}
