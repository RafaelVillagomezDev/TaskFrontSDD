import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { AppUnderTest, freshStore, routerAt } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { APP_ROUTES } from '../../../../shared/router/router';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

function alert(id: string, createdAt: string) {
  return { id, type: 'daily', periodStart: '2026-10-29', periodEnd: '2026-10-29', tasks: [], createdAt };
}

function renderAlerts() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  render(<AppUnderTest store={store} router={routerAt(APP_ROUTES, '/alerts')} />);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AlertsPage', () => {
  it('RF-35: en /alerts lista los avisos en el orden de la API, con la paginación y su total', async () => {
    mockApi({
      'GET /alerts': () =>
        apiOk({
          items: [alert('b', '2026-10-29T22:00:00Z'), alert('a', '2026-10-28T22:00:00Z')],
          page: 1,
          pageSize: 50,
          totalItems: 2,
          totalPages: 1,
        }),
    });
    renderAlerts();
    expect(screen.getByRole('heading', { level: 1, name: 'Avisos' })).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: 'Lista de avisos' });
    expect(within(list).getAllByRole('heading', { level: 2 })).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toHaveTextContent('Página 1 de 1 · 2 avisos');
  });

  it('sin avisos muestra el estado vacío y explica cuándo aparecen', async () => {
    mockApi({ 'GET /alerts': () => apiOk({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 }) });
    renderAlerts();
    expect(await screen.findByText('Todavía no tienes avisos.')).toBeInTheDocument();
    expect(screen.getByText(/A las 22:00/)).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });

  it('RF-40: mientras carga muestra el indicador', () => {
    mockApi({ 'GET /alerts': () => new Promise<Response>(() => undefined) });
    renderAlerts();
    expect(screen.getByRole('status', { name: 'Cargando…' })).toBeInTheDocument();
  });

  it('RF-44: si falla muestra el error con reintento', async () => {
    mockApi({ 'GET /alerts': () => apiFail(500, 'INTERNAL_ERROR') });
    renderAlerts();
    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent('Algo ha fallado.');
    expect(within(error).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
