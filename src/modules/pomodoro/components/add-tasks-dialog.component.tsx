import type { ReactNode } from 'react';

import { COMMON_TEXTS } from '@shared/texts/common.texts';
import { Button } from '@shared/ui/button.component';
import { Dialog } from '@shared/ui/dialog.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import type { AddTasksForm } from '../hooks/use-add-tasks-form.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';
import { NewTaskFields } from './new-task-fields.component';

interface AddTasksDialogProps {
  addForm: AddTasksForm;
  // Elección de tareas en espera (RF-29 con tareas en espera)
  children?: ReactNode;
}

const { add: texts } = POMODORO_TEXTS;

// Diálogo de añadir tareas a la sesión activa (RF-29) sobre Dialog, con las mismas filas que al empezar
export function AddTasksDialog({ addForm, children }: Readonly<AddTasksDialogProps>) {
  return (
    <Dialog open={addForm.isOpen} onOpenChange={addForm.onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>{texts.title}</Dialog.Title>
        <form noValidate aria-label={texts.title} onSubmit={addForm.onSubmit} className="flex flex-col gap-4">
          <NewTaskFields rows={addForm.rows} />
          {children}
          {addForm.formError !== undefined && <ErrorMessage message={addForm.formError} />}
          <Dialog.Actions>
            <Dialog.Close variant="secondary">{COMMON_TEXTS.cancel}</Dialog.Close>
            <Button type="submit" disabled={addForm.isSubmitting}>
              {addForm.isSubmitting ? texts.submitting : texts.submit}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
