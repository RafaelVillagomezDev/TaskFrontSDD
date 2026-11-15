import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { MAX_SESSION_TASKS } from '../../schemas/pomodoro.constants';
import type { SessionFormValues } from '../../schemas/start-session.schema';
import { useNewTaskRows } from '../use-new-task-rows.hook';

const TODAY = '2026-11-09';

const EMPTY_FORM: SessionFormValues = { duration: '25', customMinutes: '', newTasks: [], waitingTaskIds: [] };

// Formulario real de React Hook Form con la lista de tareas encima, como lo montan empezar y añadir
function setup(existingTasks = 0, defaultValues: SessionFormValues = EMPTY_FORM) {
  return renderHook(() => {
    const form = useForm<SessionFormValues>({ defaultValues });
    return { form, rows: useNewTaskRows(form, TODAY, existingTasks) };
  });
}

function waitingIds(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `w-${String(index)}`);
}

describe('useNewTaskRows', () => {
  it('RF-10: añadir crea una fila vacía con la fecha de hoy y una clave estable', () => {
    const { result } = setup();

    act(() => {
      result.current.rows.add();
    });

    expect(result.current.rows.rows).toHaveLength(1);
    expect(result.current.form.getValues('newTasks')).toEqual([{ title: '', description: '', date: TODAY }]);
    expect(result.current.rows.minDate).toBe(TODAY);
  });

  it('RF-08: quitar elimina la fila indicada', () => {
    const { result } = setup();
    act(() => {
      result.current.rows.add();
      result.current.rows.add();
    });
    const [, second] = result.current.rows.rows;

    act(() => {
      result.current.rows.remove(0);
    });

    expect(result.current.rows.rows).toEqual([second]);
  });

  it('RF-08: registra cada campo de una fila con su ruta', () => {
    const { result } = setup();
    act(() => {
      result.current.rows.add();
    });

    expect(result.current.rows.register(0, 'title').name).toBe('newTasks.0.title');
    expect(result.current.rows.register(0, 'date').name).toBe('newTasks.0.date');
  });

  it('RF-12: elegir y volver a pulsar una tarea en espera la incluye y la quita', () => {
    const { result } = setup();

    act(() => {
      result.current.rows.toggleWaiting('w-1');
    });
    expect(result.current.rows.isWaitingSelected('w-1')).toBe(true);
    expect(result.current.form.getValues('waitingTaskIds')).toEqual(['w-1']);

    act(() => {
      result.current.rows.toggleWaiting('w-1');
    });
    expect(result.current.rows.isWaitingSelected('w-1')).toBe(false);
  });

  it('RF-13: con 20 tareas entre filas y elegidas no ofrece añadir ni elegir otra, pero sí soltar una elegida', () => {
    const { result } = setup(0, { ...EMPTY_FORM, waitingTaskIds: waitingIds(MAX_SESSION_TASKS) });

    expect(result.current.rows.canAdd).toBe(false);
    expect(result.current.rows.canSelectWaiting('otra')).toBe(false);
    expect(result.current.rows.canSelectWaiting('w-0')).toBe(true);
  });

  it('RF-13: cuenta las tareas que ya tiene la sesión activa', () => {
    const { result } = setup(MAX_SESSION_TASKS - 1);
    expect(result.current.rows.canAdd).toBe(true);

    act(() => {
      result.current.rows.add();
    });

    expect(result.current.rows.canAdd).toBe(false);
  });

  it('RF-13: expone el error de la lista y el de cada campo', () => {
    const { result } = setup();
    act(() => {
      result.current.rows.add();
      result.current.form.setError('newTasks', { message: 'Demasiadas tareas' });
      result.current.form.setError('newTasks.0.title', { message: 'El título es obligatorio' });
    });

    expect(result.current.rows.listError).toBe('Demasiadas tareas');
    expect(result.current.rows.errorOf(0, 'title')).toBe('El título es obligatorio');
    expect(result.current.rows.errorOf(0, 'description')).toBeUndefined();
  });
});
