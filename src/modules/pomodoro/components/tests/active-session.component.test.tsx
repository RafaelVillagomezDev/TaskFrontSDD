import { render, screen } from '@testing-library/react';

import { pomodoroFixture, pomodoroTaskFixture } from '../../tests/pomodoro.fixtures';
import { ActiveSession } from '../active-session.component';

describe('ActiveSession', () => {
  it('RF-05 y RF-21: región con el estado y el resumen «X de Y», con lo que se le pase dentro', () => {
    const session = pomodoroFixture({
      tasks: [pomodoroTaskFixture({ id: 'a', completed: true }), pomodoroTaskFixture({ id: 'b' })],
    });
    render(
      <ActiveSession session={session}>
        <p>Contenido</p>
      </ActiveSession>,
    );
    const region = screen.getByRole('region', { name: 'Sesión en marcha' });
    expect(region).toHaveTextContent('Sesión en curso');
    expect(region).toHaveTextContent('1 de 2 tareas hechas');
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('RF-16: una sesión pausada lo indica en su encabezado', () => {
    render(<ActiveSession session={pomodoroFixture({ status: 'paused' })} />);
    expect(screen.getByRole('heading', { name: 'Sesión en pausa' })).toBeInTheDocument();
  });
});
