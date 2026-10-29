import { useMemo, useRef, useState, type BaseSyntheticEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form';

import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { formatDayLong } from '../../../shared/date/date-format.util';
import { compareDays } from '../../../shared/date/day.util';
import { useCreateTaskMutation } from '../api/tasks.api';
import { createTaskFormSchema, type TaskFormValues } from '../schemas/task-form.schema';
import { TASKS_TEXTS } from '../texts/tasks.texts';

type TaskFormField = keyof TaskFormValues;

const TASK_FORM_FIELDS: readonly TaskFormField[] = ['title', 'description', 'date'];

const EMPTY_VALUES: TaskFormValues = { title: '', description: '', date: '' };

function isTaskFormField(field: string): field is TaskFormField {
  return TASK_FORM_FIELDS.some((candidate) => candidate === field);
}

// Errores de la API: los de campo bajo su campo y el resto en un mensaje general, sin borrar lo escrito (RF-41)
function showApiError(form: UseFormReturn<TaskFormValues>, error: unknown): void {
  const { code, fieldErrors } = toApiError(error);
  let fieldErrorCount = 0;
  for (const [field, message] of Object.entries(fieldErrors)) {
    if (!isTaskFormField(field)) continue;
    form.setError(field, { message });
    fieldErrorCount += 1;
  }
  if (fieldErrorCount === 0) form.setError('root.server', { message: errorMessage(code) });
}

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
  // Un segundo envío puede llegar antes de que el botón se deshabilite (doble clic): se descarta aquí
  const inFlight = useRef(false);
  const [title, description] = useWatch({ control: form.control, name: ['title', 'description'] });

  const submit = form.handleSubmit(async (values) => {
    const result = await createTask(values);
    if (result.error !== undefined) {
      showApiError(form, result.error);
      return;
    }
    setIsOpen(false);
    const day = result.data.date;
    const isVisible = compareDays(day, weekStart) >= 0 && compareDays(day, weekEnd) <= 0;
    if (!isVisible) setNotice(TASKS_TEXTS.form.createdOutsideWeek(formatDayLong(day)));
  });

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
    onOpenChange: (open: boolean) => {
      setIsOpen(open);
    },
    onSubmit: (event?: BaseSyntheticEvent) => {
      event?.preventDefault();
      if (inFlight.current) return;
      inFlight.current = true;
      void (async () => {
        try {
          await submit(event);
        } finally {
          inFlight.current = false;
        }
      })();
    },
  };
}

export type TaskForm = ReturnType<typeof useTaskForm>;
