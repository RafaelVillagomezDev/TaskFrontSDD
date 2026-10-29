import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

// Contenido principal de cada pantalla: ancho fluido hasta el máximo de DESIGN.md (1280 px), mobile-first
export function PageContainer({ children }: Readonly<PageContainerProps>) {
  return <main className="mx-auto flex w-full max-w-content flex-col gap-8 p-4 md:p-8">{children}</main>;
}
