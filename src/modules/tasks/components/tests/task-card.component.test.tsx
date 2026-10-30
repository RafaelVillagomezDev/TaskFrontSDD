import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

describe('TaskCard (completar)', () => {
  it('RF-13 y RF-22: sin onToggleCompleted no ofrece completar', () => {
    render(
      <ul>
        <TaskCard task={TASK} />
      </ul>,
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('RF-20: la casilla se llama como la tarea, refleja su estado y avisa al pulsarla, también con teclado', async () => {
    const user = userEvent.setup();
    const onToggleCompleted = jest.fn();
    render(
      <ul>
        <TaskCard task={TASK} onToggleCompleted={onToggleCompleted} />
      </ul>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Comprar pan' });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(onToggleCompleted).toHaveBeenCalledTimes(1);
    checkbox.focus();
    await user.keyboard(' ');
    expect(onToggleCompleted).toHaveBeenCalledTimes(2);
  });

  it('RF-21: una tarea completada aparece marcada', () => {
    render(
      <ul>
        <TaskCard task={{ ...TASK, completed: true }} onToggleCompleted={jest.fn()} />
      </ul>,
    );
    expect(screen.getByRole('checkbox', { name: 'Comprar pan' })).toBeChecked();
  });

  it('con keepFocus la casilla toma el foco al montarse en su nueva lista', () => {
    render(
      <ul>
        <TaskCard task={{ ...TASK, completed: true }} onToggleCompleted={jest.fn()} keepFocus />
      </ul>,
    );
    expect(screen.getByRole('checkbox', { name: 'Comprar pan' })).toHaveFocus();
  });

  it('mientras se guarda, la casilla se anuncia deshabilitada pero conserva el foco', () => {
    render(
      <ul>
        <TaskCard task={TASK} onToggleCompleted={jest.fn()} isUpdating />
      </ul>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Comprar pan' });
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    expect(checkbox).toBeEnabled();
  });
});

describe('TaskCard (eliminar)', () => {
  it('RF-13: sin onDelete no ofrece eliminar', () => {
    render(
      <ul>
        <TaskCard task={TASK} />
      </ul>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('RF-23: el botón de eliminar se llama con el título de la tarea y avisa al pulsarlo', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <ul>
        <TaskCard task={TASK} onDelete={onDelete} />
      </ul>,
    );
    const button = screen.getByRole('button', { name: 'Eliminar «Comprar pan»' });
    expect(button.className).toContain('min-h-touch');
    await user.click(button);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe('TaskCard (editar)', () => {
  it('RF-13: sin onEdit no ofrece editar', () => {
    render(
      <ul>
        <TaskCard task={TASK} onDelete={jest.fn()} />
      </ul>,
    );
    expect(screen.queryByRole('button', { name: 'Editar «Comprar pan»' })).not.toBeInTheDocument();
  });

  it('RF-29: el botón de editar se llama con el título de la tarea y avisa al pulsarlo', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(
      <ul>
        <TaskCard task={TASK} onEdit={onEdit} onDelete={jest.fn()} />
      </ul>,
    );
    const button = screen.getByRole('button', { name: 'Editar «Comprar pan»' });
    expect(button.className).toContain('min-h-touch');
    await user.click(button);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
