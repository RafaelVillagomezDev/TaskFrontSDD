import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import { apiOk, mockApi } from '../../../../../jest/mock-api';
import { AppUnderTest, freshStore, routerAt } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { APP_ROUTES } from '../../../../shared/router/router';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

afterEach(() => {
  jest.restoreAllMocks();
});

describe('HistoryPage', () => {
  it('RF-31: en /history muestra el título, los filtros y las tareas', async () => {
    mockApi({
      'GET /tasks': () =>
        apiOk({
          items: [
            {
              id: 'a',
              title: 'Comprar pan',
              description: null,
              date: '2026-10-28',
              completed: true,
              createdAt: '2026-10-28T09:15:00Z',
              updatedAt: '2026-10-28T09:15:00Z',
            },
          ],
          page: 1,
          pageSize: 50,
          totalItems: 1,
          totalPages: 1,
        }),
    });
    const store = freshStore();
    store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
    render(<AppUnderTest store={store} router={routerAt(APP_ROUTES, '/history')} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Historial' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Filtros del historial' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Tareas del historial' });
    expect(within(list).getByRole('listitem')).toHaveTextContent('Comprar pan');
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toHaveTextContent('Página 1 de 1 · 1 tarea');
  });
});
