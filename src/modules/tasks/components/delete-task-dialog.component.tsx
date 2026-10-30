import { COMMON_TEXTS } from '../../../shared/texts/common.texts';
import { Button } from '../../../shared/ui/button.component';
import { Dialog } from '../../../shared/ui/dialog.component';
import { Text } from '../../../shared/ui/text.component';
import type { TaskDeletion } from '../hooks/use-task-actions.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';

interface DeleteTaskDialogProps {
  deletion: TaskDeletion;
}

const { delete: texts } = TASKS_TEXTS;

// Confirmación de eliminar sobre Dialog (RF-23, S-04): con el título de la tarea y sin opción de deshacer.
// El foco empieza en «Cancelar», la opción que no destruye nada
export function DeleteTaskDialog({ deletion }: Readonly<DeleteTaskDialogProps>) {
  const { pendingDelete, isDeleting } = deletion;
  return (
    <Dialog
      open={pendingDelete !== undefined}
      onOpenChange={(open) => {
        if (!open) deletion.cancelDelete();
      }}
    >
      <Dialog.Content>
        <Dialog.Title>{texts.title}</Dialog.Title>
        <Text variant="body" tone="muted" className="break-words">
          {texts.body(pendingDelete?.title ?? '')}
        </Text>
        <Dialog.Actions>
          <Dialog.Close variant="secondary">{COMMON_TEXTS.cancel}</Dialog.Close>
          <Button variant="destructive" disabled={isDeleting} onClick={deletion.confirmDelete}>
            {isDeleting ? texts.deleting : texts.confirm}
          </Button>
        </Dialog.Actions>
      </Dialog.Content>
    </Dialog>
  );
}
