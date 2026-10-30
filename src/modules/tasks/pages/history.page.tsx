import { PageContainer } from '../../../shared/layout/page-container.layout';
import { PageHeader } from '../../../shared/layout/page-header.component';
import { HistoryFilters } from '../components/history-filters.component';
import { HistoryList } from '../components/history-list.component';
import { useHistory } from '../hooks/use-history.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';

// Historial en /history (RF-31 a RF-34; plan §5.6): filtros arriba y la lista paginada debajo
export function HistoryPage() {
  const history = useHistory();
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Title>{TASKS_TEXTS.history.title}</PageHeader.Title>
      </PageHeader>
      <HistoryFilters history={history} />
      <HistoryList history={history} />
    </PageContainer>
  );
}
