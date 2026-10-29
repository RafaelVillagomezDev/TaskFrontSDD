import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { showApiError } from '../../../shared/api/api-form-error.util';
import { formatDayLong } from '../../../shared/date/date-format.util';
import { compareDays } from '../../../shared/date/day.util';
import { useSingleSubmit } from '../../../shared/ui/use-single-submit.hook';
import { useCreateTaskMutation } from '../api/tasks.api';
import { createTaskFormSchema, type TaskFormValues } from '../schemas/task-form.schema';
import { TASKS_TEXTS } from '../texts/tasks.texts';

const TASK_FORM_FIELDS: readonly (keyof TaskFormValues)[] = ['title', 'description', 'date'];

const EMPTY_VALUES: TaskFormValues = { title: '', description: '', date: '' };

export interface TaskFormOptions {
  // Día actual del dispositivo: la fecha no puede ser anterior (RF-16)
  today: string;
  // Semana visible del tablero: fuera de ella se confirma la creación con su fecha (RF-52)
  weekStart: string;
  weekEnd: string;
}

// Formulario de crear tarea (plan §5.4): se abre con la fecha propuesta (RF-15, RF-51), cuenta caracteres
// (RF-17), no se envía dos veces (RF-19) y, al crear, cierra; fuera de la semana visible avisa con la fecha (RF-52)
export function useTaskForm({ today, weekStart, weekEnd }: TaskFormOptions) {
  const schema = useMemo(() => createTaskFormSchema(today), [today]);
  const form = useForm<TaskFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [title, description] = useWatch({ control: form.control, name: ['title', 'description'] });

  const submit = form.handleSubmit(async (values) => {
    const result = await createTask(values);
    if (result.error !== undefined) {
      showApiError(form, result.error, TASK_FORM_FIELDS);
      return;
    }
    setIsOpen(false);
    const day = result.data.date;
    const isVisible = compareDays(day, weekStart) >= 0 && compareDays(day, weekEnd) <= 0;
    if (!isVisible) setNotice(TASKS_TEXTS.form.createdOutsideWeek(formatDayLong(day)));
  });

  // Un solo envío a la vez: un doble clic no crea dos tareas (RF-19)
  const onSubmit = useSingleSubmit(submit);

  return {
    form,
    isOpen,
    notice,
    minDate: today,
    counters: { title: title.trim().length, description: description.trim().length },
    isSubmitting: isLoading || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    openFor: (day: string) => {
      form.reset({ ...EMPTY_VALUES, date: day });
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
