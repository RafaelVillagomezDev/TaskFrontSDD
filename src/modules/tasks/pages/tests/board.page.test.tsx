import { jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { apiFail, apiOk, mockApi, type MockedApi } from '../../../../../jest/mock-api';
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

// El tablero también pide la racha del panel (S-10) y el último aviso (RF-37): racha 0 y sin avisos
function mockBoardApi(handlers: Parameters<typeof mockApi>[0]): MockedApi {
  return mockApi({
    'GET /streak': () => apiOk({ current: 0, best: 0 }),
    'GET /alerts': () => apiOk({ items: [], page: 1, pageSize: 1, totalItems: 0, totalPages: 0 }),
    ...handlers,
  });
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
    mockBoardApi({ 'GET /tasks': weekWith([TASK]) });
    renderBoard();
    expect(screen.getByRole('heading', { level: 1, name: 'Tablero' })).toBeInTheDocument();
    const sunday = await screen.findByRole('region', { name: 'domingo, 1 de noviembre de 2026' });
    expect(within(sunday).getByRole('listitem')).toHaveTextContent('Comprar pan');
    const board = screen.getByRole('region', { name: 'Tareas de la semana' });
    expect(within(board).getAllByRole('region')).toHaveLength(7);
    expect(within(board).getAllByRole('region')[0]).toHaveAccessibleName('jueves, 29 de octubre de 2026');
  });

  it('RNF-03: el tablero se desplaza solo dentro de su zona', async () => {
    mockBoardApi({ 'GET /tasks': weekWith([]) });
    renderBoard();
    const board = await screen.findByRole('region', { name: 'Tareas de la semana' });
    expect(board.className).toContain('overflow-x-auto');
    // Llegar al final de las columnas con el dedo no navega «atrás» ni arrastra la página
    expect(board.className).toContain('overscroll-x-contain');
  });

  it('RF-40: mientras carga muestra un indicador en la zona del tablero', () => {
    mockBoardApi({ 'GET /tasks': () => new Promise<Response>(() => undefined) });
    renderBoard();
    const panel = screen.getByRole('region', { name: 'Racha y progreso de hoy' });
    const outsidePanel = screen
      .getAllByRole('status', { name: 'Cargando…' })
      .filter((spinner) => !panel.contains(spinner));
    expect(outsidePanel).toHaveLength(1);
  });

  it('RF-13: al retroceder una semana todas las columnas indican que el día está cerrado', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    mockBoardApi({ 'GET /tasks': weekWith([]) });
    renderBoard();
    await screen.findAllByText('Sin tareas');
    await user.click(screen.getByRole('button', { name: 'Semana anterior' }));
    expect(await screen.findAllByText('Día cerrado')).toHaveLength(7);
    expect(screen.getByText('22/10/2026 – 28/10/2026')).toBeInTheDocument();
  });

  it('RF-44: si la consulta falla muestra el mensaje y reintenta', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    let calls = 0;
    mockBoardApi({
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

  it('RF-51: «Nueva tarea» abre el formulario con la fecha de hoy', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    mockBoardApi({ 'GET /tasks': weekWith([]) });
    renderBoard();
    await screen.findAllByText('Sin tareas');
    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    const dialog = screen.getByRole('dialog', { name: 'Nueva tarea' });
    expect(within(dialog).getByLabelText('Fecha')).toHaveValue('2026-10-29');
  });

  it('RF-11 y RF-15: cada columna de hoy o futura ofrece añadir una tarea con su fecha; las pasadas no', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    mockBoardApi({ 'GET /tasks': weekWith([]) });
    renderBoard();
    await screen.findAllByText('Sin tareas');
    expect(screen.getAllByRole('button', { name: /^Añadir tarea el / })).toHaveLength(7);
    await user.click(screen.getByRole('button', { name: 'Añadir tarea el domingo, 1 de noviembre de 2026' }));
    expect(within(screen.getByRole('dialog')).getByLabelText('Fecha')).toHaveValue('2026-11-01');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await user.click(screen.getByRole('button', { name: 'Semana anterior' }));
    await screen.findAllByText('Día cerrado');
    expect(screen.queryByRole('button', { name: /^Añadir tarea el / })).not.toBeInTheDocument();
  });

  it('RF-18: la tarea creada en la semana visible aparece en su columna', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    let items: unknown[] = [];
    mockBoardApi({
      'GET /tasks': () => weekWith(items)(),
      'POST /tasks': () => {
        items = [TASK];
        return apiOk(TASK, 201);
      },
    });
    renderBoard();
    await screen.findAllByText('Sin tareas');
    await user.click(screen.getByRole('button', { name: 'Añadir tarea el domingo, 1 de noviembre de 2026' }));
    await user.type(screen.getByLabelText('Título'), 'Comprar pan');
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));
    const sunday = screen.getByRole('region', { name: 'domingo, 1 de noviembre de 2026' });
    expect(await within(sunday).findByText('Comprar pan')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('RF-52: la tarea creada fuera de la semana visible se confirma con su fecha', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    mockBoardApi({
      'GET /tasks': weekWith([]),
      'POST /tasks': () => apiOk({ ...TASK, date: '2026-11-12' }, 201),
    });
    renderBoard();
    await screen.findAllByText('Sin tareas');
    await user.click(screen.getByRole('button', { name: 'Nueva tarea' }));
    await user.type(screen.getByLabelText('Título'), 'Comprar pan');
    const date = screen.getByLabelText('Fecha');
    await user.clear(date);
    await user.type(date, '2026-11-12');
    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tarea creada para el jueves, 12 de noviembre de 2026.',
    );
    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('Tarea creada para el jueves, 12 de noviembre de 2026.')).not.toBeInTheDocument();
  });

  it('RF-20: completar una tarea de hoy la pasa a «Completadas» sin esperar a la API', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    const today = { ...TASK, date: '2026-10-29' };
    mockBoardApi({
      'GET /tasks': weekWith([today]),
      'PATCH /tasks/t1': () => new Promise<Response>(() => undefined),
    });
    renderBoard();
    const column = await screen.findByRole('region', { name: 'jueves, 29 de octubre de 2026' });
    await user.click(await within(column).findByRole('checkbox', { name: 'Comprar pan' }));
    expect(within(column).getByRole('list', { name: 'Completadas' })).toHaveTextContent('Comprar pan');
    const checkbox = within(column).getByRole('checkbox', { name: 'Comprar pan' });
    expect(checkbox).toBeChecked();
    // Cambió de lista y conserva el foco para seguir con el teclado
    expect(checkbox).toHaveFocus();
  });

  it('RF-22: una tarea de un día futuro no ofrece completarla', async () => {
    mockBoardApi({ 'GET /tasks': weekWith([TASK]) });
    renderBoard();
    const sunday = await screen.findByRole('region', { name: 'domingo, 1 de noviembre de 2026' });
    await within(sunday).findByText('Comprar pan');
    expect(within(sunday).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('RF-42: si el día ya está cerrado lo explica en una alerta que se puede cerrar', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    const today = { ...TASK, date: '2026-10-29' };
    mockBoardApi({ 'GET /tasks': weekWith([today]), 'PATCH /tasks/t1': () => apiFail(409, 'DAY_CLOSED') });
    renderBoard();
    await user.click(await screen.findByRole('checkbox', { name: 'Comprar pan' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Ese día ya está cerrado: sus tareas no se pueden cambiar.');
    await user.click(within(alert).getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('RF-23 y RF-24: eliminar pide confirmación con el título y, al confirmar, la tarea desaparece del tablero', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    let items: unknown[] = [TASK];
    mockBoardApi({
      'GET /tasks': () => weekWith(items)(),
      'DELETE /tasks/t1': () => {
        items = [];
        return apiOk(null);
      },
    });
    renderBoard();
    await user.click(await screen.findByRole('button', { name: 'Eliminar «Comprar pan»' }));
    const dialog = screen.getByRole('dialog', { name: '¿Eliminar la tarea?' });
    expect(dialog).toHaveTextContent('«Comprar pan»');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => {
      expect(screen.queryByText('Comprar pan')).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('RF-23: cancelar la confirmación deja la tarea igual', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    const api = mockBoardApi({ 'GET /tasks': weekWith([TASK]) });
    renderBoard();
    await user.click(await screen.findByRole('button', { name: 'Eliminar «Comprar pan»' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Comprar pan')).toBeInTheDocument();
    expect(api.requests.some((request) => request.method === 'DELETE')).toBe(false);
  });
  it('S-10 y CE-02: completar la única tarea de hoy cambia «0 de 1» a «1 de 1» y vuelve a pedir la racha', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    const today = { ...TASK, date: '2026-10-29' };
    let current = 2;
    mockApi({
      'GET /streak': () => apiOk({ current, best: 5 }),
      'GET /tasks': weekWith([today]),
      'PATCH /tasks/t1': () => {
        current = 3;
        return apiOk({ ...today, completed: true });
      },
    });
    renderBoard();
    const panel = screen.getByRole('region', { name: 'Racha y progreso de hoy' });
    expect(await within(panel).findByText('0 de 1 tareas completadas')).toBeInTheDocument();
    expect(within(panel).getByRole('status')).toHaveTextContent('Tu racha está en juego');
    await user.click(await screen.findByRole('checkbox', { name: 'Comprar pan' }));
    expect(within(panel).getByText('1 de 1 tareas completadas')).toBeInTheDocument();
    expect(await within(panel).findByText('3 días')).toBeInTheDocument();
    expect(within(panel).queryByText('Tu racha está en juego')).not.toBeInTheDocument();
  });

  // Bug reportado el 2026-10-30: dos tareas de hoy completadas (racha 1) y después quitadas. Mientras la API
  // recalcula la racha, el panel combinaba «0 completadas hoy» con la racha anterior y parpadeaba «en juego»
  describe('RF-27: no avisa de la racha en juego con la racha anterior mientras se recalcula', () => {
    const DONE = [
      { ...TASK, id: 't1', title: 'Comprar pan', date: '2026-10-29', completed: true },
      { ...TASK, id: 't2', title: 'Llamar al banco', date: '2026-10-29', completed: true },
    ];

    // La primera racha llega al momento (1 día); cada petición siguiente espera a que el test la responda,
    // como una API lenta
    function controlledStreak() {
      const pending: ((streak: { current: number; best: number }) => void)[] = [];
      let calls = 0;
      const handler = () => {
        calls += 1;
        if (calls === 1) return apiOk({ current: 1, best: 1 });
        return new Promise<Response>((resolve) => {
          pending.push((streak) => {
            resolve(apiOk(streak));
          });
        });
      };
      // Responde la petición pendiente más antigua en cuanto llegue
      const respond = async (streak: { current: number; best: number }) => {
        await waitFor(() => {
          expect(pending.length).toBeGreaterThan(0);
        });
        pending.shift()?.(streak);
      };
      return { handler, respond, pending: () => pending.length };
    }

    it('RF-27: al eliminar las dos tareas completadas de hoy', async () => {
      const user = userEvent.setup({ advanceTimers: advance });
      let items: unknown[] = DONE;
      const streak = controlledStreak();
      mockBoardApi({
        'GET /streak': streak.handler,
        'GET /tasks': () => weekWith(items)(),
        'DELETE /tasks/t1': () => {
          items = items.filter((item) => item !== DONE[0]);
          return apiOk(null);
        },
        'DELETE /tasks/t2': () => {
          items = [];
          return apiOk(null);
        },
      });
      renderBoard();
      const panel = screen.getByRole('region', { name: 'Racha y progreso de hoy' });
      expect(await within(panel).findByText('2 de 2 tareas completadas')).toBeInTheDocument();
      expect(panel).toHaveTextContent(/Racha actual\s*1 día/);

      // Primera: queda una completada, la racha sigue en 1
      await user.click(await screen.findByRole('button', { name: 'Eliminar «Comprar pan»' }));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
      await streak.respond({ current: 1, best: 1 });
      expect(await within(panel).findByText('1 de 1 tareas completadas')).toBeInTheDocument();

      // Segunda: hoy queda sin tareas y la API aún recalcula la racha (pasará a 0)
      await user.click(await screen.findByRole('button', { name: 'Eliminar «Llamar al banco»' }));
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
      expect(await within(panel).findByText('Sin tareas hoy')).toBeInTheDocument();
      expect(streak.pending()).toBe(1);
      expect(within(panel).queryByText('Tu racha está en juego')).not.toBeInTheDocument();

      await streak.respond({ current: 0, best: 1 });
      await waitFor(() => {
        expect(panel).toHaveTextContent(/Racha actual\s*0 días/);
      });
      expect(within(panel).queryByText('Tu racha está en juego')).not.toBeInTheDocument();
    });

    it('RF-27: al desmarcar las dos tareas completadas de hoy', async () => {
      const user = userEvent.setup({ advanceTimers: advance });
      const streak = controlledStreak();
      mockBoardApi({
        'GET /streak': streak.handler,
        'GET /tasks': weekWith(DONE),
        'PATCH /tasks/t1': () => apiOk({ ...DONE[0], completed: false }),
        'PATCH /tasks/t2': () => apiOk({ ...DONE[1], completed: false }),
      });
      renderBoard();
      const panel = screen.getByRole('region', { name: 'Racha y progreso de hoy' });
      expect(await within(panel).findByText('2 de 2 tareas completadas')).toBeInTheDocument();

      // Primera: queda una completada, la racha sigue en 1
      await user.click(await screen.findByRole('checkbox', { name: 'Comprar pan' }));
      await streak.respond({ current: 1, best: 1 });
      // Segunda: ninguna completada hoy y la API aún recalcula la racha (pasará a 0)
      await user.click(await screen.findByRole('checkbox', { name: 'Llamar al banco' }));
      expect(await within(panel).findByText('0 de 2 tareas completadas')).toBeInTheDocument();
      expect(within(panel).queryByText('Tu racha está en juego')).not.toBeInTheDocument();

      await streak.respond({ current: 0, best: 1 });
      await waitFor(() => {
        expect(panel).toHaveTextContent(/Racha actual\s*0 días/);
      });
      expect(within(panel).queryByText('Tu racha está en juego')).not.toBeInTheDocument();
    });
  });

  it('RF-28: sin tareas hoy, «Crear una tarea» del panel abre el formulario con la fecha de hoy', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    mockBoardApi({ 'GET /tasks': weekWith([]) });
    renderBoard();
    const panel = screen.getByRole('region', { name: 'Racha y progreso de hoy' });
    expect(await within(panel).findByText('Sin tareas hoy')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Crear una tarea' }));
    expect(within(screen.getByRole('dialog', { name: 'Nueva tarea' })).getByLabelText('Fecha')).toHaveValue(
      '2026-10-29',
    );
  });
  it('RF-29 y RF-30: editar el título lo muestra actualizado en el tablero, sin ofrecer cambiar la fecha', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    let items: unknown[] = [TASK];
    const api = mockBoardApi({
      'GET /tasks': () => weekWith(items)(),
      'PATCH /tasks/t1': () => {
        const updated = { ...TASK, title: 'Comprar pan integral' };
        items = [updated];
        return apiOk(updated);
      },
    });
    renderBoard();
    await user.click(await screen.findByRole('button', { name: 'Editar «Comprar pan»' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar tarea' });
    expect(within(dialog).queryByLabelText('Fecha')).not.toBeInTheDocument();
    const title = within(dialog).getByLabelText('Título');
    await user.clear(title);
    await user.type(title, 'Comprar pan integral');
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }));
    const sunday = screen.getByRole('region', { name: 'domingo, 1 de noviembre de 2026' });
    expect(await within(sunday).findByText('Comprar pan integral')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await api.bodyOf('PATCH /tasks/t1')).toEqual({ title: 'Comprar pan integral', description: null });
  });
  it('RF-37: destaca el aviso generado hoy con su tipo, sus tareas y el acceso a los avisos', async () => {
    const user = userEvent.setup({ advanceTimers: advance });
    mockBoardApi({
      'GET /tasks': weekWith([]),
      'GET /alerts': () =>
        apiOk({
          items: [
            {
              id: 'al1',
              type: 'daily',
              periodStart: '2026-10-29',
              periodEnd: '2026-10-29',
              tasks: [{ id: 't1', title: 'Llamar al banco', date: '2026-10-29' }],
              createdAt: new Date(2026, 9, 29, 22, 0).toISOString(),
            },
          ],
          page: 1,
          pageSize: 1,
          totalItems: 1,
          totalPages: 1,
        }),
    });
    renderBoard();
    const banner = await screen.findByRole('region', { name: 'Aviso de hoy' });
    expect(banner).toHaveTextContent('Aviso diario de hoy');
    expect(banner).toHaveTextContent('1 tarea pendiente');
    await user.click(within(banner).getByRole('link', { name: 'Ver aviso' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Avisos' })).toBeInTheDocument();
  });
});
