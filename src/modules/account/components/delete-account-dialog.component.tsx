import { COMMON_TEXTS } from '../../../shared/texts/common.texts';
import { Box } from '../../../shared/ui/box.component';
import { Button } from '../../../shared/ui/button.component';
import { Dialog } from '../../../shared/ui/dialog.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { PasswordInput } from '../../../shared/ui/password-input.component';
import { Text } from '../../../shared/ui/text.component';
import type { AccountDeletion } from '../hooks/use-delete-account.hook';
import { ACCOUNT_TEXTS } from '../texts/account.texts';

interface DeleteAccountDialogProps {
  deletion: AccountDeletion;
}

const { deleteAccount: texts } = ACCOUNT_TEXTS;

// Borrar la cuenta (RF-49, S-04): una zona que avisa de lo que se elimina y un diálogo que pide la contraseña.
// Sin contraseña no se confirma; una incorrecta se marca en su campo (RF-48)
export function DeleteAccountDialog({ deletion }: Readonly<DeleteAccountDialogProps>) {
  const { form, isDeleting, formError } = deletion;
  return (
    <Box as="section" variant="card" aria-labelledby="delete-account-title" className="flex flex-col gap-4">
      <Text as="h2" variant="h4" id="delete-account-title">
        {texts.title}
      </Text>
      <Text variant="body-sm" tone="muted">
        {texts.warning}
      </Text>
      <Dialog open={deletion.isOpen} onOpenChange={deletion.onOpenChange}>
        <div>
          <Dialog.Trigger variant="destructive">{texts.open}</Dialog.Trigger>
        </div>
        <Dialog.Content>
          <Dialog.Title>{texts.dialogTitle}</Dialog.Title>
          <Text variant="body" tone="muted">
            {texts.warning}
          </Text>
          <form noValidate onSubmit={deletion.onSubmit} className="flex flex-col gap-4">
            <PasswordInput
              {...form.register('password')}
              label={texts.confirmPassword.label}
              autoComplete="current-password"
              errorText={form.formState.errors.password?.message}
            />
            {formError !== undefined && <ErrorMessage message={formError} />}
            <Dialog.Actions>
              <Dialog.Close variant="secondary">{COMMON_TEXTS.cancel}</Dialog.Close>
              <Button type="submit" variant="destructive" disabled={isDeleting}>
                {isDeleting ? texts.deleting : texts.confirm}
              </Button>
            </Dialog.Actions>
          </form>
        </Dialog.Content>
      </Dialog>
    </Box>
  );
}
