import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import { apiOk, mockApi } from '@test-utils/mock-api';
import { AppUnderTest, freshStore, routerAt } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { APP_ROUTES } from '@shared/router/router';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function task(id: string, title: string, description: string | null = null) {
  return {
    id,
    title,
    description,
    date: '2026-11-08',
    completed: true,
    createdAt: '2026-11-08T09:15:00Z',
    updatedAt: '2026-11-08T09:15:00Z',
  };
}

function renderTaskDay(items: unknown[]) {
  mockApi({
    'GET /tasks': () =>
      apiOk({ items, page: 1, pageSize: 50, totalItems: items.length, totalPages: items.length === 0 ? 0 : 1 }),
  });
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  const router = routerAt(APP_ROUTES, '/taskday');
  render(<AppUnderTest store={store} router={router} />);
  return router;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('TaskDayPage', () => {
  it('RF-01, RF-02 y RF-03: en /taskday muestra «Hecho hoy», las tareas completadas de hoy y cuántas son', async () => {
    renderTaskDay([task('a', 'Comprar pan', 'Integral'), task('b', 'Llamar al banco')]);
    expect(screen.getByRole('heading', { level: 1, name: 'Hecho hoy' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Tareas hechas hoy' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Comprar pan');
    expect(items[0]).toHaveTextContent('Integral');
    expect(items[1]).toHaveTextContent('Llamar al banco');
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toHaveTextContent('2 tareas completadas hoy');
  });

  it('RF-05: las tareas son de solo lectura, sin desmarcar, editar ni eliminar', async () => {
    renderTaskDay([task('a', 'Comprar pan')]);
    const list = await screen.findByRole('list', { name: 'Tareas hechas hoy' });
    expect(within(list).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(list).queryByRole('button')).not.toBeInTheDocument();
  });

  it('RF-04: sin tareas completadas hoy muestra el estado vacío con acceso al tablero', async () => {
    const router = renderTaskDay([]);
    expect(await screen.findByText('Todavía no has completado ninguna tarea hoy.')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Ir al tablero' });
    expect(link).toHaveAttribute('href', '/');
    link.click();
    expect(await screen.findByRole('heading', { level: 1, name: 'Tablero' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });
});
