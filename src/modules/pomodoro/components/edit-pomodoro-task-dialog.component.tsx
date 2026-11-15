import { COMMON_TEXTS } from '@shared/texts/common.texts';
import { Button } from '@shared/ui/button.component';
import { Dialog } from '@shared/ui/dialog.component';
import { ErrorMessage } from '@shared/ui/error-message.component';
import { Input } from '@shared/ui/input.component';
import { Text } from '@shared/ui/text.component';
import { Textarea } from '@shared/ui/textarea.component';
import type { EditPomodoroTask } from '../hooks/use-edit-pomodoro-task.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface EditPomodoroTaskDialogProps {
  editTask: EditPomodoroTask;
}

const { edit: texts } = POMODORO_TEXTS;

// Diálogo de editar una tarea del pomodoro (RF-35, RF-36): título y descripción, con el error bajo cada campo; la
// fecha no se puede cambiar y se explica por qué no aparece
export function EditPomodoroTaskDialog({ editTask }: Readonly<EditPomodoroTaskDialogProps>) {
  const { errors } = editTask.form.formState;
  return (
    <Dialog open={editTask.isOpen} onOpenChange={editTask.onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>{texts.title}</Dialog.Title>
        <form noValidate aria-label={texts.title} onSubmit={editTask.onSubmit} className="flex flex-col gap-4">
          <Input
            {...editTask.form.register('title')}
            label={texts.taskTitle}
            autoComplete="off"
            errorText={errors.title?.message}
          />
          <Textarea
            {...editTask.form.register('description')}
            label={texts.description}
            errorText={errors.description?.message}
          />
          <Text variant="body-sm" tone="muted">
            {texts.dateFixed}
          </Text>
          {editTask.formError !== undefined && <ErrorMessage message={editTask.formError} />}
          <Dialog.Actions>
            <Dialog.Close variant="secondary">{COMMON_TEXTS.cancel}</Dialog.Close>
            <Button type="submit" disabled={editTask.isSubmitting}>
              {editTask.isSubmitting ? texts.saving : texts.save}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
