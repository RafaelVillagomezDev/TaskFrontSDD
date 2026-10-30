import { jest } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router';

import { apiOk, mockApi } from '../../../../../jest/mock-api';
import { freshStore } from '../../../../../jest/render-app';
import { useHistory } from '../../hooks/use-history.hook';
import { HistoryFilters } from '../history-filters.component';

function Harness() {
  const history = useHistory();
  const location = useLocation();
  return (
    <>
      <HistoryFilters history={history} />
      <output aria-label="URL">{location.search}</output>
    </>
  );
}

function renderFilters(url = '/history') {
  mockApi({ 'GET /tasks': () => apiOk({ items: [], page: 1, pageSize: 50, totalItems: 0, totalPages: 0 }) });
  render(
    <Provider store={freshStore()}>
      <MemoryRouter initialEntries={[url]}>
        <Harness />
      </MemoryRouter>
    </Provider>,
  );
  return { user: userEvent.setup(), form: screen.getByRole('form', { name: 'Filtros del historial' }) };
}

function urlText(): string | null {
  return screen.getByRole('status', { name: 'URL' }).textContent;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('HistoryFilters', () => {
  it('RF-32: estado con sus tres opciones y «Desde» y «Hasta» como fechas', () => {
    const { form } = renderFilters();
    const status = within(form).getByLabelText('Estado');
    expect(
      within(status)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Todas', 'Completadas', 'Pendientes']);
    expect(within(form).getByLabelText('Desde')).toHaveAttribute('type', 'date');
    expect(within(form).getByLabelText('Hasta')).toHaveAttribute('type', 'date');
    expect(within(form).queryByRole('button', { name: 'Quitar filtros' })).not.toBeInTheDocument();
  });

  it('RF-32: «Filtrar» aplica el estado y el rango', async () => {
    const { user, form } = renderFilters();
    await user.selectOptions(within(form).getByLabelText('Estado'), 'Pendientes');
    await user.type(within(form).getByLabelText('Desde'), '2026-10-01');
    await user.type(within(form).getByLabelText('Hasta'), '2026-10-31');
    await user.click(within(form).getByRole('button', { name: 'Filtrar' }));
    await waitFor(() => {
      expect(urlText()).toBe('?status=pending&from=2026-10-01&to=2026-10-31');
    });
  });

  it('RF-33: «desde» posterior a «hasta» muestra el error bajo «Desde» y no filtra', async () => {
    const { user, form } = renderFilters();
    await user.type(within(form).getByLabelText('Desde'), '2026-10-31');
    await user.type(within(form).getByLabelText('Hasta'), '2026-10-01');
    await user.click(within(form).getByRole('button', { name: 'Filtrar' }));
    const from = within(form).getByLabelText('Desde');
    await waitFor(() => {
      expect(from).toHaveAccessibleDescription('«Desde» no puede ser posterior a «Hasta».');
    });
    expect(from).toHaveAttribute('aria-invalid', 'true');
    expect(urlText()).toBe('');
  });

  it('con filtros aplicados, «Quitar filtros» los quita', async () => {
    const { user, form } = renderFilters('/history?status=completed');
    expect(within(form).getByLabelText('Estado')).toHaveValue('completed');
    await user.click(within(form).getByRole('button', { name: 'Quitar filtros' }));
    await waitFor(() => {
      expect(within(form).getByLabelText('Estado')).toHaveValue('all');
    });
    expect(urlText()).toBe('');
  });
});
