import { formatDayLong } from '../../../shared/date/date-format.util';
import { toDayKey } from '../../../shared/date/day.util';
import { Box } from '../../../shared/ui/box.component';
import { Button } from '../../../shared/ui/button.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Input } from '../../../shared/ui/input.component';
import { Notice } from '../../../shared/ui/notice.component';
import { Text } from '../../../shared/ui/text.component';
import type { ProfileForm as ProfileFormModel } from '../hooks/use-profile-form.hook';
import { ACCOUNT_TEXTS } from '../texts/account.texts';

interface ProfileFormProps {
  profile: ProfileFormModel;
}

const { profile: texts } = ACCOUNT_TEXTS;

// Fecha de alta en la fecha local del dispositivo, como el resto de días de la aplicación
function createdDay(createdAt: string | undefined): string {
  return createdAt === undefined ? '' : formatDayLong(toDayKey(new Date(createdAt)));
}

// Perfil (RF-38): email y fecha de alta de solo lectura y el nombre, el único dato que se puede cambiar
export function ProfileForm({ profile }: Readonly<ProfileFormProps>) {
  const { form, isSubmitting, formError } = profile;
  return (
    <Box as="section" variant="card" aria-labelledby="profile-title" className="flex flex-col gap-6">
      <Text as="h2" variant="h4" id="profile-title">
        {texts.title}
      </Text>
      <dl className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-caption text-foreground-muted">{texts.email}</dt>
          <dd className="text-body break-words">{profile.email}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-caption text-foreground-muted">{texts.createdAt}</dt>
          <dd className="text-body first-letter:uppercase">
            <time dateTime={profile.createdAt}>{createdDay(profile.createdAt)}</time>
          </dd>
        </div>
      </dl>
      <form noValidate onSubmit={profile.onSubmit} className="flex flex-col gap-4">
        <Input
          {...form.register('name')}
          label={texts.name}
          autoComplete="name"
          helperText={texts.nameHelp}
          errorText={form.formState.errors.name?.message}
        />
        {formError !== undefined && <ErrorMessage message={formError} />}
        {profile.notice !== undefined && <Notice onDismiss={profile.dismissNotice}>{profile.notice}</Notice>}
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? texts.saving : texts.save}
          </Button>
        </div>
      </form>
    </Box>
  );
}
