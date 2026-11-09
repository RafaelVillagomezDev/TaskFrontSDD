import { COMMON_TEXTS } from '@shared/texts/common.texts';
import { Button } from '@shared/ui/button.component';
import { Dialog } from '@shared/ui/dialog.component';
import { Text } from '@shared/ui/text.component';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

// Qué se confirma: terminar la sesión (RF-26) o borrar una tarea en espera (RF-33)
export type ConfirmVariant = 'finish' | 'deleteTask';

interface ConfirmPomodoroDialogProps {
  variant: ConfirmVariant;
  open: boolean;
  busy: boolean;
  // Título de la tarea que se va a borrar (solo con deleteTask)
  subject?: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
}

const { confirm: texts } = POMODORO_TEXTS;

// Confirmación de una acción del pomodoro sobre Dialog (RF-26, RF-33), como la de eliminar tarea de la 001: el
// foco empieza en «Cancelar», la opción que no cambia nada, y Escape cierra sin confirmar
export function ConfirmPomodoroDialog({
  variant,
  open,
  busy,
  subject,
  onConfirm,
  onCancel,
}: Readonly<ConfirmPomodoroDialogProps>) {
  const copy = texts[variant];
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <Dialog.Content>
        <Dialog.Title>{copy.title}</Dialog.Title>
        <Text variant="body" tone="muted" className="break-words">
          {copy.body(subject ?? '')}
        </Text>
        <Dialog.Actions>
          <Dialog.Close variant="secondary">{COMMON_TEXTS.cancel}</Dialog.Close>
          <Button variant={variant === 'deleteTask' ? 'destructive' : 'primary'} disabled={busy} onClick={onConfirm}>
            {copy.confirm}
          </Button>
        </Dialog.Actions>
      </Dialog.Content>
    </Dialog>
  );
}
