import { jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiFail, apiOk, mockApi } from '../../../../../jest/mock-api';
import { AppUnderTest, freshStore, routerAt } from '../../../../../jest/render-app';
import { sessionStarted } from '../../../auth';
import { APP_ROUTES } from '../../../../shared/router/router';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };
const NOON = new Date(2026, 9, 29, 12, 0, 0);

const TASK = {
  id: 't1',
  title: 'Comprar pan',
  description: null,
  date: '2026-11-01',
  completed: false,
  createdAt: '2026-10-29T09:15:00Z',
  updatedAt: '2026-10-29T09:15:00Z',
};

function weekWith(items: unknown[]) {
  return () => apiOk({ items, page: 1, pageSize: 100, totalItems: items.length, totalPages: 1 });
}

function renderBoard() {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  render(<AppUnderTest store={store} router={routerAt(APP_ROUTES, '/')} />);
}

// userEvent espera con los temporizadores simulados
function advance(ms: number): void {
  jest.advanceTimersByTime(ms);
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOON, advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('BoardPage', () => {
  it('RF-09: en / muestra el título y 7 columnas desde hoy, cada tarea en la columna de su día', async () => {
    mockApi({ 'GET /tasks': weekWith([TASK]) });
    renderBoard();
    expect(screen.getByRole('heading', { level: 1, name: 'Tablero' })).toBeInTheDocument();
    const sunday = await screen.findByRole('region', { name: 'domingo, 1 de noviembre de 2026' });
    expect(within(sunday).getByRole('listitem')).toHaveTextContent('Comprar pan');
    const board = screen.getByRole('region', { name: 'Tareas de la semana' });
    expect(within(board).getAllByRole('region')).toHaveLength(7);
    expect(within(board).getAllByRole('region')[0]).toHaveAccessibleName('jueves, 29 de octubre de 2026');
  });

  it('RNF-03: el tablero se desplaza solo dentro de su zona', async () => {
    mockApi({ 'GET /tasks': weekWith([]) });
    renderBoard();
    const board = await screen.findByRole('region', { name: 'Tareas de la semana' });
    expect(board.className).toContain('overflow-x-auto');
  });

  it('RF-40: mientras carga muestra un indicador en la zona del tablero', () => {
    mockApi({ 'GET /tasks': () => new Promise<Response>(() => undefined) });
    renderBoard();
    expect(screen.getByRole('status', { name: 'Cargando…' })).toBeInTheDocument();
  });

  it('RF-13: al retroceder una semana todas las columnas indican que el día está cerrado', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    mockApi({ 'GET /tasks': weekWith([]) });
    renderBoard();
    await screen.findAllByText('Sin tareas');
    await user.click(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(await screen.findAllByText('Día cerrado')).toHaveLength(7);
    expect(screen.getByText('22/10/2026 – 28/10/2026')).toBeInTheDocument();
  });

  it('RF-44: si la consulta falla muestra el mensaje y reintenta', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    let calls = 0;
    mockApi({
      'GET /tasks': () => {
        calls += 1;
        return calls === 1 ? apiFail(503, 'INTERNAL_ERROR') : weekWith([TASK])();
      },
    });
    renderBoard();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Algo ha fallado');
    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Comprar pan')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
