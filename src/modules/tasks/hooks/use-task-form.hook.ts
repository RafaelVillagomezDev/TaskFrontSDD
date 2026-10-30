import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { showApiError } from '../../../shared/api/api-form-error.util';
import { formatDayLong } from '../../../shared/date/date-format.util';
import { compareDays } from '../../../shared/date/day.util';
import { useSingleSubmit } from '../../../shared/ui/use-single-submit.hook';
import { useCreateTaskMutation, useUpdateTaskMutation } from '../api/tasks.api';
import { createTaskFormSchema, editTaskFormSchema, type TaskFormValues } from '../schemas/task-form.schema';
import type { Task } from '../schemas/task.schema';
import { TASKS_TEXTS } from '../texts/tasks.texts';

const TASK_FORM_FIELDS: readonly (keyof TaskFormValues)[] = ['title', 'description', 'date'];

// Crear lleva fecha; editar solo cambia título y descripción (RF-29)
export type TaskFormMode = 'create' | 'edit';

function descriptionForApi(description: string): string | null {
  return description === '' ? null : description;
}

const EMPTY_VALUES: TaskFormValues = { title: '', description: '', date: '' };

export interface TaskFormOptions {
  // Día actual del dispositivo: la fecha no puede ser anterior (RF-16)
  today: string;
  // Semana visible del tablero: fuera de ella se confirma la creación con su fecha (RF-52)
  weekStart: string;
  weekEnd: string;
}

// Formulario de crear y editar tarea (plan §5.4). Crear se abre con la fecha propuesta (RF-15, RF-51) y, fuera de
// la semana visible, avisa con la fecha (RF-52); editar se abre con la tarea y solo cambia título y descripción
// (RF-29). Ambos cuentan caracteres (RF-17), no se envían dos veces (RF-19) y cierran al guardar (RF-18, RF-30)
export function useTaskForm({ today, weekStart, weekEnd }: TaskFormOptions) {
  const [editing, setEditing] = useState<Task | undefined>(undefined);
  const schema = useMemo(
    () => (editing === undefined ? createTaskFormSchema(today) : editTaskFormSchema(today)),
    [today, editing],
  );
  const form = useForm<TaskFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isSaving }] = useUpdateTaskMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [title, description] = useWatch({ control: form.control, name: ['title', 'description'] });

  const create = async (values: TaskFormValues) => {
    const result = await createTask(values);
    if (result.error !== undefined) {
      showApiError(form, result.error, TASK_FORM_FIELDS);
      return;
    }
    setIsOpen(false);
    const day = result.data.date;
    const isVisible = compareDays(day, weekStart) >= 0 && compareDays(day, weekEnd) <= 0;
    if (!isVisible) setNotice(TASKS_TEXTS.form.createdOutsideWeek(formatDayLong(day)));
  };

  // Al guardar, la API invalida la semana y la tarea se ve actualizada donde aparezca (RF-30, D-7)
  const save = async (task: Task, values: TaskFormValues) => {
    const changes = { title: values.title, description: descriptionForApi(values.description) };
    const result = await updateTask({ id: task.id, changes });
    if (result.error !== undefined) {
      showApiError(form, result.error, TASK_FORM_FIELDS);
      return;
    }
    setIsOpen(false);
  };

  const mode: TaskFormMode = editing === undefined ? 'create' : 'edit';
  const submit = form.handleSubmit(async (values) => {
    await (editing === undefined ? create(values) : save(editing, values));
  });

  // Un solo envío a la vez: un doble clic no crea dos tareas (RF-19)
  const onSubmit = useSingleSubmit(submit);

  return {
    form,
    mode,
    isOpen,
    notice,
    minDate: today,
    counters: { title: title.trim().length, description: description.trim().length },
    isSubmitting: isCreating || isSaving || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    openFor: (day: string) => {
      setEditing(undefined);
      form.reset({ ...EMPTY_VALUES, date: day });
      setNotice(undefined);
      setIsOpen(true);
    },
    // Editar una tarea de hoy o futura con su título y descripción actuales (RF-29)
    openEdit: (task: Task) => {
      setEditing(task);
      form.reset({ title: task.title, description: task.description ?? '', date: task.date });
      setNotice(undefined);
      setIsOpen(true);
    },
    dismissNotice: () => {
      setNotice(undefined);
    },
    onOpenChange: (open: boolean) => {
      setIsOpen(open);
    },
    onSubmit,
  };
}

export type TaskForm = ReturnType<typeof useTaskForm>;
