import { PageContainer } from '../../../shared/layout/page-container.layout';
import { PageHeader } from '../../../shared/layout/page-header.component';
import { DeleteAccountDialog } from '../components/delete-account-dialog.component';
import { PasswordForm } from '../components/password-form.component';
import { ProfileForm } from '../components/profile-form.component';
import { useDeleteAccount } from '../hooks/use-delete-account.hook';
import { usePasswordForm } from '../hooks/use-password-form.hook';
import { useProfileForm } from '../hooks/use-profile-form.hook';
import { ACCOUNT_TEXTS } from '../texts/account.texts';

// Cuenta en /account (RF-38, RF-39, RF-48, RF-49, RF-53; plan §5.8): perfil, contraseña y borrado de la cuenta,
// de lo más usado a lo más delicado
export function AccountPage() {
  const profile = useProfileForm();
  const passwordForm = usePasswordForm();
  const deletion = useDeleteAccount();
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Title>{ACCOUNT_TEXTS.page.title}</PageHeader.Title>
      </PageHeader>
      <div className="flex w-full max-w-dialog flex-col gap-8">
        <ProfileForm profile={profile} />
        <PasswordForm passwordForm={passwordForm} />
        <DeleteAccountDialog deletion={deletion} />
      </div>
    </PageContainer>
  );
}
