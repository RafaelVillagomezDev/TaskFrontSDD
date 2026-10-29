import { render, screen } from '@testing-library/react';

import type { Task } from '../../schemas/task.schema';
import { TaskCard } from '../task-card.component';

const TASK: Task = {
  id: 't1',
  title: 'Comprar pan',
  description: null,
  date: '2026-10-29',
  completed: false,
  createdAt: '2026-10-29T09:15:00Z',
  updatedAt: '2026-10-29T09:15:00Z',
};

describe('TaskCard (lectura)', () => {
  it('RF-10: muestra el título y el estado pendiente en un elemento de lista', () => {
    render(
      <ul>
        <TaskCard task={TASK} />
      </ul>,
    );
    const card = screen.getByRole('listitem');
    expect(card).toHaveTextContent('Comprar pan');
    expect(card).toHaveTextContent('Pendiente');
  });

  it('RF-10: una tarea completada se distingue con su estado y el título tachado', () => {
    render(
      <ul>
        <TaskCard task={{ ...TASK, completed: true }} />
      </ul>,
    );
    expect(screen.getByText('Completada')).toBeInTheDocument();
    expect(screen.getByText('Comprar pan').className).toContain('line-through');
  });

  it('muestra la descripción cuando la tiene', () => {
    render(
      <ul>
        <TaskCard task={{ ...TASK, description: 'Integral' }} />
      </ul>,
    );
    expect(screen.getByText('Integral')).toBeInTheDocument();
  });

  it('RNF-03: un título largo sin espacios se parte en lugar de desbordar la columna', () => {
    render(
      <ul>
        <TaskCard task={{ ...TASK, title: 'a'.repeat(200) }} />
      </ul>,
    );
    const title = screen.getByText('a'.repeat(200));
    expect(title.className).toContain('break-words');
    expect(title.className).toContain('line-clamp-2');
  });
});
