import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';

import type { TaskFormValues } from '@modules/tasks';
import { MAX_SESSION_TASKS } from '../schemas/pomodoro.constants';
import type { SessionFormValues } from '../schemas/start-session.schema';

export type NewTaskField = keyof TaskFormValues;

type NewTaskPath = `newTasks.${number}.${NewTaskField}`;

const NEW_TASK_PATH = /^newTasks\.\d+\.(title|description|date)$/;

// Ruta de un campo de una fila con el tipo que espera React Hook Form, sin aserciones (CONSTITUTION.md IV)
function isNewTaskPath(path: string): path is NewTaskPath {
  return NEW_TASK_PATH.test(path);
}

function newTaskPath(index: number, name: NewTaskField): NewTaskPath {
  const path = `newTasks.${String(index)}.${name}`;
  if (!isNewTaskPath(path)) throw new Error(`Ruta de tarea no válida: ${path}`);
  return path;
}

// Lista de tareas de un formulario (RF-08 a RF-13): filas de tareas nuevas, cada una con su clave estable, el
// registro de sus campos y sus errores, y las tareas en espera elegidas. Añadir propone la fecha de hoy (RF-10) y
// ni añadir ni elegir se ofrece al llegar a 20 tareas en total (RF-13)
// Los dos formularios comparten SessionFormValues: UseFormReturn es invariante y no admite un subconjunto de campos
export function useNewTaskRows(form: UseFormReturn<SessionFormValues>, today: string, existingTasks = 0) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'newTasks' });
  const selected = useWatch({ control: form.control, name: 'waitingTaskIds' });
  const { errors } = form.formState;
  const hasRoom = existingTasks + fields.length + selected.length < MAX_SESSION_TASKS;

  return {
    rows: fields.map((field) => field.id),
    minDate: today,
    canAdd: hasRoom,
    // Tareas en espera elegidas para incluir (RF-12): cuentan para el máximo de 20 (RF-13)
    isWaitingSelected: (id: string) => selected.includes(id),
    canSelectWaiting: (id: string) => hasRoom || selected.includes(id),
    toggleWaiting: (id: string) => {
      const next = selected.includes(id) ? selected.filter((current) => current !== id) : [...selected, id];
      form.setValue('waitingTaskIds', next);
    },
    // Error de la lista entera: más de 20 tareas (RF-13)
    listError: errors.newTasks?.message,
    register: (index: number, name: NewTaskField) => form.register(newTaskPath(index, name)),
    errorOf: (index: number, name: NewTaskField) => errors.newTasks?.[index]?.[name]?.message,
    add: () => {
      append({ title: '', description: '', date: today });
    },
    remove: (index: number) => {
      remove(index);
    },
  };
}

export type NewTaskRows = ReturnType<typeof useNewTaskRows>;
