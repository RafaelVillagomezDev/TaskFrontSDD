import { Outlet } from 'react-router';

import { PageContainer } from '@shared/layout/page-container.layout';
import { PageHeader } from '@shared/layout/page-header.component';
import { SubNavigation } from '@shared/layout/sub-navigation.component';
import { ROUTES } from '@shared/router/routes.constants';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

const { layout: texts } = POMODORO_TEXTS;

// Estructura común de la sección del pomodoro (RF-51, plan §5.2): título, subnavegación y la vista de cada ruta.
// «Historial» sigue activo en el detalle de una sesión (RF-54)
export function PomodoroLayout() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader>
          <PageHeader.Title>{texts.title}</PageHeader.Title>
        </PageHeader>
        <SubNavigation aria-label={texts.sections}>
          <SubNavigation.Link to={ROUTES.pomodoro}>{texts.session}</SubNavigation.Link>
          <SubNavigation.Link to={ROUTES.pomodoroHistory} matchSubroutes>
            {texts.history}
          </SubNavigation.Link>
          <SubNavigation.Link to={ROUTES.pomodoroAchievements}>{texts.achievements}</SubNavigation.Link>
        </SubNavigation>
      </div>
      <Outlet />
    </PageContainer>
  );
}
