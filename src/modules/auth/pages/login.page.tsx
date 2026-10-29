import { AuthLayout } from '../../../shared/layout/auth-layout.layout';
import { ROUTES } from '../../../shared/router/routes.constants';
import { Button } from '../../../shared/ui/button.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Input } from '../../../shared/ui/input.component';
import { PasswordInput } from '../../../shared/ui/password-input.component';
import { Text } from '../../../shared/ui/text.component';
import { AuthNotice } from '../components/auth-notice.component';
import { AuthSwitch } from '../components/auth-switch.component';
import { useLoginForm } from '../hooks/use-login-form.hook';
import { AUTH_TEXTS } from '../texts/auth.texts';

// Inicio de sesión (RF-04, RF-05, RF-07): avisos de cuenta creada o sesión caducada y errores en español
export function LoginPage() {
  const { form, onSubmit, isSubmitting, notice, formError } = useLoginForm();
  const { errors } = form.formState;
  return (
    <AuthLayout>
      <Text as="h1" variant="h3">
        {AUTH_TEXTS.login.title}
      </Text>
      {notice === 'registered' && <AuthNotice>{AUTH_TEXTS.login.registered}</AuthNotice>}
      {notice === 'expired' && <AuthNotice>{AUTH_TEXTS.login.expired}</AuthNotice>}
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          {...form.register('email')}
          label={AUTH_TEXTS.fields.email}
          type="email"
          autoComplete="email"
          errorText={errors.email?.message}
        />
        <PasswordInput
          {...form.register('password')}
          label={AUTH_TEXTS.fields.password.label}
          autoComplete="current-password"
          errorText={errors.password?.message}
        />
        {formError !== undefined && <ErrorMessage message={formError} />}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? AUTH_TEXTS.login.submitting : AUTH_TEXTS.login.submit}
        </Button>
      </form>
      <AuthSwitch>
        {AUTH_TEXTS.login.noAccount}
        <AuthSwitch.Link to={ROUTES.register}>{AUTH_TEXTS.login.toRegister}</AuthSwitch.Link>
      </AuthSwitch>
    </AuthLayout>
  );
}
