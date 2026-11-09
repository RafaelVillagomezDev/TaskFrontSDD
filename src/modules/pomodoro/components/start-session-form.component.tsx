import type { ReactNode } from 'react';

import { Button } from '@shared/ui/button.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Text } from '@shared/ui/text.component';
import type { StartSessionForm as StartSessionFormModel } from '../hooks/use-start-session-form.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';
import { DurationPicker } from './duration-picker.component';
import { NewTaskFields } from './new-task-fields.component';

interface StartSessionFormProps {
  startForm: StartSessionFormModel;
  // Elección de tareas en espera, bajo las tareas nuevas (RF-12)
  children?: ReactNode;
}

const { start: texts } = POMODORO_TEXTS;

// Formulario de empezar una sesión (RF-04, RF-06 a RF-14): duración, tareas nuevas y, si hay, tareas en espera.
// El botón se deshabilita mientras se envía (001 RF-19) y un error de la API va encima de él (RF-47)
export function StartSessionForm({ startForm, children }: Readonly<StartSessionFormProps>) {
  return (
    <section className="flex flex-col gap-6">
      <Text as="h2" variant="h3">
        {texts.title}
      </Text>
      <form noValidate aria-label={texts.form} onSubmit={startForm.onSubmit} className="flex flex-col gap-8">
        <DurationPicker startForm={startForm} />
        <div className="flex flex-col gap-3">
          <Text as="h3" variant="body" className="font-semibold">
            {texts.tasks}
          </Text>
          <Text variant="body-sm" tone="muted">
            {texts.tasksHelp}
          </Text>
          <NewTaskFields rows={startForm.rows} />
          {children}
        </div>
        {startForm.formError !== undefined && <ErrorMessage message={startForm.formError} />}
        <Button type="submit" size="lg" disabled={startForm.isSubmitting} className="w-full sm:w-auto sm:self-start">
          {startForm.isSubmitting ? texts.submitting : texts.submit}
        </Button>
      </form>
    </section>
  );
}
