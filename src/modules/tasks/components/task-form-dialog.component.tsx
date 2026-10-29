import { COMMON_TEXTS } from '../../../shared/texts/common.texts';
import { Button } from '../../../shared/ui/button.component';
import { DateInput } from '../../../shared/ui/date-input.component';
import { Dialog } from '../../../shared/ui/dialog.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Input } from '../../../shared/ui/input.component';
import { Textarea } from '../../../shared/ui/textarea.component';
import type { TaskForm } from '../hooks/use-task-form.hook';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../schemas/tasks.constants';
import { TASKS_TEXTS } from '../texts/tasks.texts';

interface TaskFormDialogProps {
  taskForm: TaskForm;
}

const { form: texts } = TASKS_TEXTS;

// Diálogo de crear tarea sobre Dialog (plan §5.4): título y descripción con contador (RF-17), fecha desde hoy
// (RF-16) y botón deshabilitado mientras se envía (RF-19)
export function TaskFormDialog({ taskForm }: Readonly<TaskFormDialogProps>) {
  const { form, counters, isSubmitting, formError } = taskForm;
  const { errors } = form.formState;
  return (
    <Dialog open={taskForm.isOpen} onOpenChange={taskForm.onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>{texts.createTitle}</Dialog.Title>
        <form noValidate onSubmit={taskForm.onSubmit} className="flex flex-col gap-4">
          <Input
            {...form.register('title')}
            label={texts.title}
            autoComplete="off"
            helperText={texts.counter(counters.title, TITLE_MAX_LENGTH)}
            errorText={errors.title?.message}
          />
          <Textarea
            {...form.register('description')}
            label={texts.description}
            helperText={texts.counter(counters.description, DESCRIPTION_MAX_LENGTH)}
            errorText={errors.description?.message}
          />
          <DateInput
            {...form.register('date')}
            label={texts.date}
            min={taskForm.minDate}
            errorText={errors.date?.message}
          />
          {formError !== undefined && <ErrorMessage message={formError} />}
          <Dialog.Actions>
            <Dialog.Close variant="secondary">{COMMON_TEXTS.cancel}</Dialog.Close>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? texts.creating : texts.create}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
