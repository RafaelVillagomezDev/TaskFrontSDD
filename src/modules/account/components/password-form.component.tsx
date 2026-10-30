import { Box } from '../../../shared/ui/box.component';
import { Button } from '../../../shared/ui/button.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Notice } from '../../../shared/ui/notice.component';
import { PasswordInput } from '../../../shared/ui/password-input.component';
import { Text } from '../../../shared/ui/text.component';
import type { PasswordForm as PasswordFormModel } from '../hooks/use-password-form.hook';
import { ACCOUNT_TEXTS } from '../texts/account.texts';

interface PasswordFormProps {
  passwordForm: PasswordFormModel;
}

const { changePassword: texts } = ACCOUNT_TEXTS;

// Cambiar contraseña (RF-39, RF-46, RF-48): la actual y la nueva, con la opción de mostrarlas (S-11)
export function PasswordForm({ passwordForm }: Readonly<PasswordFormProps>) {
  const { form, isSubmitting, formError } = passwordForm;
  const { errors } = form.formState;
  return (
    <Box as="section" variant="card" aria-labelledby="password-title" className="flex flex-col gap-6">
      <Text as="h2" variant="h4" id="password-title">
        {texts.title}
      </Text>
      <form noValidate onSubmit={passwordForm.onSubmit} className="flex flex-col gap-4">
        <PasswordInput
          {...form.register('currentPassword')}
          label={texts.current.label}
          autoComplete="current-password"
          errorText={errors.currentPassword?.message}
        />
        <PasswordInput
          {...form.register('newPassword')}
          label={texts.next.label}
          autoComplete="new-password"
          helperText={texts.next.help}
          errorText={errors.newPassword?.message}
        />
        {formError !== undefined && <ErrorMessage message={formError} />}
        {passwordForm.notice !== undefined && (
          <Notice onDismiss={passwordForm.dismissNotice}>{passwordForm.notice}</Notice>
        )}
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? texts.submitting : texts.submit}
          </Button>
        </div>
      </form>
    </Box>
  );
}
