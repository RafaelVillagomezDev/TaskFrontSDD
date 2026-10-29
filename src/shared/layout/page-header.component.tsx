import type { ReactNode } from 'react';

import { Text } from '../ui/text.component';

interface PageHeaderProps {
  children: ReactNode;
}

// Cabecera de pantalla (DESIGN.md Page Header): título y, debajo en móvil o a la derecha desde md, sus acciones
function PageHeaderRoot({ children }: Readonly<PageHeaderProps>) {
  return <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">{children}</header>;
}

// H1 de DESIGN.md desde lg; en pantallas pequeñas, H2 para que el título no ocupe media pantalla
function PageHeaderTitle({ children }: Readonly<PageHeaderProps>) {
  return (
    <Text as="h1" variant="h2" className="lg:text-h1">
      {children}
    </Text>
  );
}

function PageHeaderActions({ children }: Readonly<PageHeaderProps>) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export const PageHeader = Object.assign(PageHeaderRoot, {
  Title: PageHeaderTitle,
  Actions: PageHeaderActions,
});
