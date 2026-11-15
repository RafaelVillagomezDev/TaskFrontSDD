import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { showApiError } from '@shared/api/api-form-error.util';
import { useCurrentDay } from '@shared/date/use-current-day.hook';
import { useSingleSubmit } from '@shared/ui/use-single-submit.hook';
import { useAddPomodoroTasksMutation } from '../api/pomodoro.api';
import { MAX_SESSION_TASKS } from '../schemas/pomodoro.constants';
import type { Pomodoro } from '../schemas/pomodoro.schema';
import { createAddTasksSchema } from '../schemas/add-tasks.schema';
import type { SessionFormValues } from '../schemas/start-session.schema';
import { useNewTaskRows } from './use-new-task-rows.hook';
import { START_SESSION_DEFAULTS, toNewPomodoroTasks } from './use-start-session-form.hook';

// Añadir tareas a la sesión activa (RF-29, API-004 RF-25, RF-51): se abre con una fila vacía, las nuevas aparecen al
// final de la lista (API-004 RF-64) y no se ofrece si la sesión ya tiene 20 (RF-13). Un rechazo (POMODORO_TASK_LIMIT,
// DAY_CLOSED) se muestra y conserva lo escrito (RF-47, RF-48)
export function useAddTasksForm(session: Pomodoro | undefined) {
  const today = useCurrentDay();
  const existing = session?.totalTasks ?? 0;
  const schema = useMemo(() => createAddTasksSchema(today, existing), [today, existing]);
  const form = useForm<SessionFormValues>({ resolver: zodResolver(schema), defaultValues: START_SESSION_DEFAULTS });
  const rows = useNewTaskRows(form, today, existing);
  const [addTasks, { isLoading }] = useAddPomodoroTasksMutation();
  const [isOpen, setIsOpen] = useState(false);

  const submit = form.handleSubmit(async (values) => {
    if (session === undefined) return;
    const result = await addTasks({
      id: session.id,
      newTasks: toNewPomodoroTasks(values.newTasks),
      waitingTaskIds: values.waitingTaskIds,
    });
    if (result.error === undefined) {
      setIsOpen(false);
      return;
    }
    showApiError(form, result.error, []);
  });

  return {
    form,
    rows,
    isOpen,
    canOpen: session !== undefined && existing < MAX_SESSION_TASKS,
    isSubmitting: isLoading || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    open: () => {
      form.reset({ ...START_SESSION_DEFAULTS, newTasks: [{ title: '', description: '', date: today }] });
      setIsOpen(true);
    },
    onOpenChange: (open: boolean) => {
      setIsOpen(open);
    },
    onSubmit: useSingleSubmit(submit),
  };
}

export type AddTasksForm = ReturnType<typeof useAddTasksForm>;
