import { AuthLayout } from '../../../shared/layout/auth-layout.layout';
import { ROUTES } from '../../../shared/router/routes.constants';
import { Button } from '../../../shared/ui/button.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Input } from '../../../shared/ui/input.component';
import { PasswordInput } from '../../../shared/ui/password-input.component';
import { Text } from '../../../shared/ui/text.component';
import { AuthSwitch } from '../components/auth-switch.component';
import { useRegisterForm } from '../hooks/use-register-form.hook';
import { AUTH_TEXTS } from '../texts/auth.texts';

// Registro (RF-01 a RF-03, S-11): un único campo de contraseña con la opción de mostrarla
export function RegisterPage() {
  const { form, onSubmit, isSubmitting, formError } = useRegisterForm();
  const { errors } = form.formState;
  return (
    <AuthLayout>
      <Text as="h1" variant="h3">
        {AUTH_TEXTS.register.title}
      </Text>
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
          autoComplete="new-password"
          helperText={AUTH_TEXTS.fields.password.help}
          errorText={errors.password?.message}
        />
        <Input
          {...form.register('name')}
          label={AUTH_TEXTS.fields.name}
          autoComplete="name"
          errorText={errors.name?.message}
        />
        {formError !== undefined && <ErrorMessage message={formError} />}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? AUTH_TEXTS.register.submitting : AUTH_TEXTS.register.submit}
        </Button>
      </form>
      <AuthSwitch>
        {AUTH_TEXTS.register.hasAccount}
        <AuthSwitch.Link to={ROUTES.login}>{AUTH_TEXTS.register.toLogin}</AuthSwitch.Link>
      </AuthSwitch>
    </AuthLayout>
  );
}
