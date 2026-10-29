import type { ReactNode } from 'react';

import { PageContainer } from '../layout/page-container.layout';
import { PageHeader } from '../layout/page-header.component';

interface PlaceholderPageProps {
  children: ReactNode;
}

// Pantalla vacía de una ruta cuyo módulo aún no existe (T045); cada historia la sustituye por su página
export function PlaceholderPage({ children }: Readonly<PlaceholderPageProps>) {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Title>{children}</PageHeader.Title>
      </PageHeader>
    </PageContainer>
  );
}
