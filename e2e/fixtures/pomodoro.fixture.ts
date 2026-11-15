import { test as sessionTest } from './session.fixture';
import { PomodoroPage } from '../pages/pomodoro.po';

interface PomodoroFixtures {
  // /pomodoro con la sesión de una cuenta nueva por test (003 plan D-13): cada test tiene su propia «sesión
  // activa», así que no hay POMODORO_ALREADY_ACTIVE entre tests ni modo serie. Al borrar la cuenta se borra su
  // pomodoro (R-9)
  pomodoro: PomodoroPage;
}

export const test = sessionTest.extend<PomodoroFixtures>({
  pomodoro: async ({ signedInPage }, provide) => {
    const pomodoro = new PomodoroPage(signedInPage);
    await pomodoro.goto();
    await provide(pomodoro);
  },
});

export { expect } from '@playwright/test';
