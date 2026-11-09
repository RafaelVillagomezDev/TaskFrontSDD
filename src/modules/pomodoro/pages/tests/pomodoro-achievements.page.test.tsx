import { jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';

import { apiFail, apiOk, mockApi } from '@test-utils/mock-api';
import { appWrapper, freshStore } from '@test-utils/render-app';
import { catalogFixture } from '../../tests/pomodoro.fixtures';
import { PomodoroAchievementsPage } from '../pomodoro-achievements.page';

function renderPage() {
  return render(<PomodoroAchievementsPage />, { wrapper: appWrapper(freshStore(), '/pomodoro/achievements') });
}

function valueOf(region: HTMLElement, label: string) {
  return within(region).getByText(label).closest('div')?.querySelector('dd')?.textContent;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PomodoroAchievementsPage', () => {
  it('RF-41, RF-42 y RF-53: muestra la racha del pomodoro y los 11 logros en orden', async () => {
    mockApi({
      'GET /pomodoro-streak': () => apiOk({ current: 0, best: 0 }),
      'GET /pomodoro-achievements': () => apiOk(catalogFixture()),
    });
    renderPage();

    const streak = await screen.findByRole('region', { name: 'Racha del pomodoro' });
    expect(await within(streak).findAllByText('0 días', { selector: 'dd' })).toHaveLength(2);
    expect(valueOf(streak, 'Racha actual')).toBe('0 días');
    expect(valueOf(streak, 'Mejor racha')).toBe('0 días');

    const list = await screen.findByRole('list', { name: 'Logros' });
    const names = within(list)
      .getAllByRole('heading')
      .map((heading) => heading.textContent);
    expect(names).toEqual(catalogFixture().map((achievement) => achievement.name));
  });

  it('RF-67: si falla la racha muestra el error con «Reintentar» solo en la racha y mantiene los logros', async () => {
    mockApi({
      'GET /pomodoro-streak': () => apiFail(500, 'INTERNAL_ERROR'),
      'GET /pomodoro-achievements': () => apiOk(catalogFixture()),
    });
    renderPage();

    const streak = await screen.findByRole('region', { name: 'Racha del pomodoro' });
    expect(await within(streak).findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: 'Logros' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Reintentar' })).toHaveLength(1);
  });

  it('RF-44 (001): si fallan los logros muestra el error con «Reintentar»', async () => {
    mockApi({
      'GET /pomodoro-streak': () => apiOk({ current: 0, best: 0 }),
      'GET /pomodoro-achievements': () => apiFail(500, 'INTERNAL_ERROR'),
    });
    renderPage();

    const achievements = await screen.findByRole('region', { name: 'Logros del pomodoro' });
    expect(await within(achievements).findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
