import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { showApiError } from '@shared/api/api-form-error.util';
import { toApiError } from '@shared/api/api-error.util';
import { useCurrentDay } from '@shared/date/use-current-day.hook';
import { useSingleSubmit } from '@shared/ui/use-single-submit.hook';
import { useStartPomodoroMutation, type NewPomodoroTask } from '../api/pomodoro.api';
import type { Pomodoro } from '../schemas/pomodoro.schema';
import { DEFAULT_DURATION } from '../schemas/pomodoro.constants';
import {
  CUSTOM_DURATION,
  createStartSessionSchema,
  durationMinutesOf,
  type SessionFormValues,
} from '../schemas/start-session.schema';
import { useNewTaskRows } from './use-new-task-rows.hook';

export const START_SESSION_DEFAULTS: SessionFormValues = {
  duration: String(DEFAULT_DURATION),
  customMinutes: '',
  newTasks: [],
  waitingTaskIds: [],
};

// Tarea nueva tal como la espera la API: sin espacios en los extremos y la descripción vacía como null (API-004 RF-53)
export function toNewPomodoroTasks(tasks: SessionFormValues['newTasks']): NewPomodoroTask[] {
  return tasks.map(({ title, description, date }) => {
    const trimmed = description.trim();
    return { title: title.trim(), description: trimmed === '' ? null : trimmed, date };
  });
}

export interface StartSessionOptions {
  // En el gesto de enviar, antes de llamar a la API: prepara el sonido de fin (plan D-5)
  onBeforeSubmit?: () => void;
  // Sesión recién empezada: se anuncia a los lectores de pantalla (RF-63)
  onStarted?: (session: Pomodoro) => void;
}

// Formulario de empezar una sesión (RF-06 a RF-14, RF-46, RF-47, RF-55, RF-56): duración con 25 por defecto,
// tareas nuevas con la fecha de hoy propuesta y tareas en espera elegidas. Un error de la API conserva lo escrito;
// con POMODORO_ALREADY_ACTIVE la API vuelve a pedir la lista y la pantalla pasa a la sesión activa (RF-46)
export function useStartSessionForm({ onBeforeSubmit, onStarted }: StartSessionOptions = {}) {
  const today = useCurrentDay();
  const schema = useMemo(() => createStartSessionSchema(today), [today]);
  const form = useForm<SessionFormValues>({ resolver: zodResolver(schema), defaultValues: START_SESSION_DEFAULTS });
  const [startPomodoro, { isLoading }] = useStartPomodoroMutation();
  const rows = useNewTaskRows(form, today);
  const duration = useWatch({ control: form.control, name: 'duration' });

  const submit = form.handleSubmit(async (values) => {
    onBeforeSubmit?.();
    const result = await startPomodoro({
      durationMinutes: durationMinutesOf(values),
      newTasks: toNewPomodoroTasks(values.newTasks),
      waitingTaskIds: values.waitingTaskIds,
    });
    if (result.error === undefined) {
      form.reset(START_SESSION_DEFAULTS);
      onStarted?.(result.data);
      return;
    }
    if (toApiError(result.error).code === 'POMODORO_ALREADY_ACTIVE') return;
    // Los campos que rechace la API no se corresponden con los del formulario: el mensaje va al error general
    showApiError(form, result.error, []);
  });

  return {
    form,
    rows,
    isCustomDuration: duration === CUSTOM_DURATION,
    isSubmitting: isLoading || form.formState.isSubmitting,
    formError: form.formState.errors.root?.server?.message,
    // Un solo envío a la vez: un doble clic no empieza dos sesiones (001 RF-19)
    onSubmit: useSingleSubmit(submit),
  };
}

export type StartSessionForm = ReturnType<typeof useStartSessionForm>;
