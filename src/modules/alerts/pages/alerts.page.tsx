import { EmptyState } from '../../../shared/layout/empty-state.component';
import { PageContainer } from '../../../shared/layout/page-container.layout';
import { PageHeader } from '../../../shared/layout/page-header.component';
import { ErrorMessage } from '../../../shared/ui/error-message.component';
import { Pagination } from '../../../shared/ui/pagination.component';
import { Spinner } from '../../../shared/ui/spinner.component';
import { Text } from '../../../shared/ui/text.component';
import { AlertItem } from '../components/alert-item.component';
import { useAlertsPage, type AlertsPageModel } from '../hooks/use-alerts-page.hook';
import { ALERTS_TEXTS } from '../texts/alerts.texts';

const { page: texts } = ALERTS_TEXTS;

// Zona de la lista: carga y error solo aquí (RF-40, RF-44)
function AlertsContent({ alertsPage }: Readonly<{ alertsPage: AlertsPageModel }>) {
  if (alertsPage.status === 'loading') return <Spinner />;
  if (alertsPage.status === 'error') {
    return <ErrorMessage message={alertsPage.errorMessage ?? ''} onRetry={alertsPage.retry} />;
  }
  if (alertsPage.alerts.length === 0) {
    return (
      <EmptyState>
        <Text variant="body-sm" className="font-medium">
          {texts.empty}
        </Text>
        <Text variant="body-sm" tone="muted">
          {texts.emptyDetail}
        </Text>
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <ul aria-label={texts.list} className="flex flex-col gap-4">
        {alertsPage.alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </ul>
      <Pagination page={alertsPage.page} totalPages={alertsPage.totalPages} onPageChange={alertsPage.goToPage}>
        {texts.total(alertsPage.totalItems)}
      </Pagination>
    </div>
  );
}

// Avisos en /alerts (RF-35, RF-36; plan §5.7): del más reciente al más antiguo, paginados
export function AlertsPage() {
  const alertsPage = useAlertsPage();
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Title>{texts.title}</PageHeader.Title>
      </PageHeader>
      <AlertsContent alertsPage={alertsPage} />
    </PageContainer>
  );
}
