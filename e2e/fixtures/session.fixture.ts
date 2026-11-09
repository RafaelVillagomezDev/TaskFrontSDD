import type { Page } from '@playwright/test';

import { test as authTest } from './auth.fixture';
import { loginInPage } from './api-client';

interface SessionFixtures {
  // Página con la sesión de una cuenta nueva (freshAccount) ya iniciada, sin pasar por el formulario de login
  // (003 plan D-15). Los tests que prueban el login siguen entrando por la interfaz
  signedInPage: Page;
}

export const test = authTest.extend<SessionFixtures>({
  signedInPage: async ({ page, freshAccount }, provide) => {
    await loginInPage(page, freshAccount);
    await provide(page);
  },
});

export { expect } from '@playwright/test';
