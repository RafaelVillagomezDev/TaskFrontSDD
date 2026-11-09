import type { ReactNode } from 'react';
import { render } from '@testing-library/react';

import { appWrapper, freshStore } from '@test-utils/render-app';
import { sessionStarted } from '@modules/auth';
import { useStartSessionForm, type StartSessionForm } from '../hooks/use-start-session-form.hook';

const USER = { id: 'u1', email: 'ana@example.com', name: 'Ana', createdAt: '2026-10-29T10:00:00.000Z' };

interface HarnessProps {
  children: (startForm: StartSessionForm) => ReactNode;
}

// Monta una pieza del formulario de empezar con su hook real, para probarla como la usa la página
function Harness({ children }: Readonly<HarnessProps>) {
  const startForm = useStartSessionForm();
  return <>{children(startForm)}</>;
}

export function renderWithStartForm(children: (startForm: StartSessionForm) => ReactNode) {
  const store = freshStore();
  store.dispatch(sessionStarted({ user: USER, csrfToken: 'sesion-1' }));
  return render(<Harness>{children}</Harness>, { wrapper: appWrapper(store, '/pomodoro') });
}
