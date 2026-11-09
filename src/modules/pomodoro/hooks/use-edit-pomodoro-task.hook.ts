import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { showApiError } from '@shared/api/api-form-error.util';
import { useCurrentDay } from '@shared/date/use-current-day.hook';
import { useSingleSubmit } from '@shared/ui/use-single-submit.hook';
import { useUpdatePomodoroTaskMutation } from '../api/pomodoro.api';
import { createEditPomodoroTaskSchema, type EditPomodoroTaskValues } from '../schemas/edit-pomodoro-task.schema';
import type { PomodoroTask } from '../schemas/pomodoro.schema';

const FIELDS: readonly (keyof EditPomodoroTaskValues)[] = ['title', 'description'];

// Editar el título y la descripción de una tarea en espera o de la sesión activa (RF-35, RF-36), nunca su fecha. Se
// abre con sus valores actuales; un rechazo (la sesión terminó en otra pestaña) se muestra y conserva lo escrito
export function useEditPomodoroTask() {
  const today = useCurrentDay();
  const schema = useMemo(() => createEditPomodoroTaskSchema(today), [today]);
  const form = useForm<EditPomodoroTaskValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });
  const [updateTask, { isLoading }] = useUpdatePomodoroTaskMutation();
  const [editing, setEditing] = useState<PomodoroTask | undefined>(undefined);

  const submit = form.handleSubmit(async ({ title, description }) => {
    if (editing === undefined) return;
    const trimmed = description.trim();
    const result = await updateTask({
      id: editing.id,
      changes: { title: title.trim(), description: trimmed === '' ? null : trimmed },
    });
    if (result.error === undefined) {
      setEditing(undefined);
      return;
    }
    showApiError(form, result.error, FIELDS);
  });

  return {
    form,
    isOpen: editing !== undefined,
    isSubmitting: isLoading || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    open: (task: PomodoroTask) => {
      form.reset({ title: task.title, description: task.description ?? '' });
      setEditing(task);
    },
    onOpenChange: (open: boolean) => {
      if (!open) setEditing(undefined);
    },
    onSubmit: useSingleSubmit(submit),
  };
}

export type EditPomodoroTask = ReturnType<typeof useEditPomodoroTask>;
