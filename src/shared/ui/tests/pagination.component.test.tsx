import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Pagination } from '../pagination.component';

describe('RF-34: Pagination', () => {
  it('indica la página actual, el total de páginas y el resumen que recibe en children', () => {
    render(
      <Pagination page={2} totalPages={5} onPageChange={jest.fn()}>
        230 tareas
      </Pagination>,
    );
    const nav = screen.getByRole('navigation', { name: 'Paginación' });
    expect(nav).toHaveTextContent('Página 2 de 5');
    expect(nav).toHaveTextContent('230 tareas');
  });

  it('va a la página anterior y a la siguiente', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Página anterior' }));
    await user.click(screen.getByRole('button', { name: 'Página siguiente' }));
    expect(onPageChange.mock.calls).toEqual([[1], [3]]);
  });

  it('desactiva «anterior» en la primera página y «siguiente» en la última', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    rerender(<Pagination page={3} totalPages={3} onPageChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('con una sola página o ninguna no muestra los botones', () => {
    render(<Pagination page={1} totalPages={1} onPageChange={jest.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
