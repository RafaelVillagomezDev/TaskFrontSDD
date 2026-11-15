import { render, screen } from '@testing-library/react';

import { SessionTaskList } from '../session-task-list.component';

describe('SessionTaskList', () => {
  it('RF-20: lista con nombre accesible y las filas en el orden recibido', () => {
    render(
      <SessionTaskList count={2}>
        <li>Primera</li>
        <li>Segunda</li>
      </SessionTaskList>,
    );
    const list = screen.getByRole('list', { name: 'Tareas de la sesión' });
    expect(list).toHaveTextContent('PrimeraSegunda');
  });

  it('sin tareas avisa en lugar de mostrar una lista vacía', () => {
    render(<SessionTaskList count={0}>{null}</SessionTaskList>);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('Esta sesión no tiene tareas.')).toBeInTheDocument();
  });
});
