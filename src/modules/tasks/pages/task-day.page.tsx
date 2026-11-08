import { Link } from 'react-router';

import { PageContainer } from '@shared/layout/page-container.layout';
import { PageHeader } from '@shared/layout/page-header.component';
import { ROUTES } from '@shared/router/routes.constants';
import { Button } from '@shared/ui/button.component';
import { Text } from '@shared/ui/text.component';
import { PagedTaskList } from '../components/paged-task-list.component';
import { useTaskDay } from '../hooks/use-task-day.hook';
import { TASKS_TEXTS } from '../texts/tasks.texts';

const { taskDay: texts } = TASKS_TEXTS;

// «Hecho hoy» en /taskday (spec 002, RF-01 a RF-05; plan §5.2): las tareas completadas hoy, en solo lectura
export function TaskDayPage() {
  const taskDay = useTaskDay();
  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Title>{texts.title}</PageHeader.Title>
      </PageHeader>
      <PagedTaskList list={taskDay} variant="taskDay">
        <Text variant="body-sm" tone="muted">
          {texts.empty}
        </Text>
        <Button as={Link} to={ROUTES.board} variant="secondary" size="sm">
          {texts.goToBoard}
        </Button>
      </PagedTaskList>
    </PageContainer>
  );
}
