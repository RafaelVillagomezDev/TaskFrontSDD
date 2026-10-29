import { render, screen, within } from '@testing-library/react';

import { AppShell } from '../app-shell.layout';
import { AuthLayout } from '../auth-layout.layout';
import { BoardColumn } from '../board-column.component';
import { EmptyState } from '../empty-state.component';
import { Navbar } from '../navbar.component';
import { PageContainer } from '../page-container.layout';
import { PageHeader } from '../page-header.component';
import { Sidebar } from '../sidebar.component';

describe('RF-50: AppShell, Sidebar y Navbar', () => {
  it('compone Sidebar y la columna con Navbar y contenido por children', () => {
    render(
      <AppShell>
        <Sidebar>Navegación lateral</Sidebar>
        <AppShell.Body>
          <Navbar>Barra superior</Navbar>
          <PageContainer>Contenido</PageContainer>
        </AppShell.Body>
      </AppShell>,
    );
    expect(screen.getByRole('complementary')).toHaveTextContent('Navegación lateral');
    expect(screen.getByRole('banner')).toHaveTextContent('Barra superior');
    expect(screen.getByRole('main')).toHaveTextContent('Contenido');
  });

  it('D-12: el Sidebar solo se ve desde lg, con el ancho y el divisor de DESIGN.md', () => {
    render(<Sidebar>Nav</Sidebar>);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar.className).toContain('hidden');
    expect(sidebar.className).toContain('lg:flex');
    expect(sidebar.className).toContain('w-sidebar');
    expect(sidebar.className).toContain('border-r');
  });

  it('la Navbar mide 64 px y tiene el divisor inferior', () => {
    render(<Navbar>Barra</Navbar>);
    const navbar = screen.getByRole('banner');
    expect(navbar.className).toContain('h-navbar');
    expect(navbar.className).toContain('border-b');
  });

  it('VII.5: la columna de contenido no ensancha la página', () => {
    render(
      <AppShell>
        <AppShell.Body>Cuerpo</AppShell.Body>
      </AppShell>,
    );
    expect(screen.getByText('Cuerpo').className).toContain('min-w-0');
  });
});

describe('PageContainer y PageHeader', () => {
  it('PageContainer es el <main> con ancho fluido hasta max-w-content', () => {
    render(<PageContainer>Hola</PageContainer>);
    const main = screen.getByRole('main');
    expect(main.className).toContain('w-full');
    expect(main.className).toContain('max-w-content');
  });

  it('PageHeader compone título h1 y acciones por children', () => {
    render(
      <PageHeader>
        <PageHeader.Title>Tablero</PageHeader.Title>
        <PageHeader.Actions>
          <button type="button">Nueva tarea</button>
        </PageHeader.Actions>
      </PageHeader>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Tablero' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva tarea' })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('muestra su contenido centrado', () => {
    render(<EmptyState>No hay avisos todavía.</EmptyState>);
    expect(screen.getByText('No hay avisos todavía.').className).toContain('text-center');
  });
});

describe('BoardColumn', () => {
  it('es una sección nombrada con columna de 264 px, cabecera, título y lista', () => {
    render(
      <BoardColumn aria-label="jueves 29 de octubre">
        <BoardColumn.Header>
          <BoardColumn.Title>Jueves</BoardColumn.Title>
        </BoardColumn.Header>
        <BoardColumn.List>
          <li>Tarea</li>
        </BoardColumn.List>
      </BoardColumn>,
    );
    const column = screen.getByRole('region', { name: 'jueves 29 de octubre' });
    expect(column.className).toContain('w-column');
    expect(column.className).toContain('shrink-0');
    expect(within(column).getByRole('heading', { name: 'Jueves' })).toBeInTheDocument();
    expect(within(column).getAllByRole('listitem')).toHaveLength(1);
  });

  it('la lista admite un nombre accesible para distinguir varios grupos en la columna', () => {
    render(
      <BoardColumn aria-label="jueves">
        <BoardColumn.List aria-label="Completadas">
          <li>Tarea</li>
        </BoardColumn.List>
      </BoardColumn>,
    );
    expect(screen.getByRole('list', { name: 'Completadas' })).toBeInTheDocument();
  });
});

describe('S-09: AuthLayout', () => {
  it('muestra la marca Kompitu y el contenido en una tarjeta de ancho fluido', () => {
    render(<AuthLayout>Formulario</AuthLayout>);
    expect(screen.getByText('Kompitu')).toBeInTheDocument();
    const card = screen.getByText('Formulario');
    expect(card.className).toContain('w-full');
    expect(card.className).toContain('max-w-dialog');
  });
});
