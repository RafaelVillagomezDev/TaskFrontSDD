import { COMMON_TEXTS } from '../../../shared/texts/common.texts';
import { Button } from '../../../shared/ui/button.component';
import { DateInput } from '../../../shared/ui/date-input.component';
import { Dialog } from '../../../shared/ui/dialog.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import type { HelperTone } from '../../../shared/ui/field.component';
import { Input } from '../../../shared/ui/input.component';
import { Textarea } from '../../../shared/ui/textarea.component';
import type { TaskForm } from '../hooks/use-task-form.hook';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../schemas/tasks.constants';
import { TASKS_TEXTS } from '../texts/tasks.texts';

interface TaskFormDialogProps {
  taskForm: TaskForm;
}

const { form: texts } = TASKS_TEXTS;

// El contador pasa a rojo en cuanto se supera el máximo, antes de intentar enviar (RF-17)
function counterTone(length: number, max: number): HelperTone {
  return length > max ? 'danger' : 'muted';
}

function submitLabel(taskForm: TaskForm): string {
  if (taskForm.mode === 'edit') return taskForm.isSubmitting ? texts.saving : texts.save;
  return taskForm.isSubmitting ? texts.creating : texts.create;
}

// Diálogo único de crear y editar tarea sobre Dialog (plan §5.4): título y descripción con contador (RF-17),
// fecha desde hoy solo al crear (RF-16, RF-29) y botón deshabilitado mientras se envía (RF-19)
export function TaskFormDialog({ taskForm }: Readonly<TaskFormDialogProps>) {
  const { form, counters, isSubmitting, formError, mode } = taskForm;
  const { errors } = form.formState;
  return (
    <Dialog open={taskForm.isOpen} onOpenChange={taskForm.onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>{mode === 'edit' ? texts.editTitle : texts.createTitle}</Dialog.Title>
        <form noValidate onSubmit={taskForm.onSubmit} className="flex flex-col gap-4">
          <Input
            {...form.register('title')}
            label={texts.title}
            autoComplete="off"
            helperText={texts.counter(counters.title, TITLE_MAX_LENGTH)}
            helperTone={counterTone(counters.title, TITLE_MAX_LENGTH)}
            errorText={errors.title?.message}
          />
          <Textarea
            {...form.register('description')}
            label={texts.description}
            helperText={texts.counter(counters.description, DESCRIPTION_MAX_LENGTH)}
            helperTone={counterTone(counters.description, DESCRIPTION_MAX_LENGTH)}
            errorText={errors.description?.message}
          />
          {/* La fecha de una tarea no se puede cambiar (RF-29, API-001 RF-37) */}
          {mode === 'create' && (
            <DateInput
              {...form.register('date')}
              label={texts.date}
              min={taskForm.minDate}
              errorText={errors.date?.message}
            />
          )}
          {formError !== undefined && <ErrorMessage message={formError} />}
          <Dialog.Actions>
            <Dialog.Close variant="secondary">{COMMON_TEXTS.cancel}</Dialog.Close>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel(taskForm)}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
