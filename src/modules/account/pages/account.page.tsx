import { PageContainer } from '../../../shared/layout/page-container.layout';
import { PageHeader } from '../../../shared/layout/page-header.component';
import { ProfileForm } from '../components/profile-form.component';
import { useProfileForm } from '../hooks/use-profile-form.hook';
import { ACCOUNT_TEXTS } from '../texts/account.texts';

// Cuenta en /account (RF-38, RF-53; plan §5.8): perfil con el nombre editable
export function AccountPage() {
  const profile = useProfileForm();
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Title>{ACCOUNT_TEXTS.page.title}</PageHeader.Title>
      </PageHeader>
      <div className="flex w-full max-w-dialog flex-col gap-8">
        <ProfileForm profile={profile} />
      </div>
    </PageContainer>
  );
}
