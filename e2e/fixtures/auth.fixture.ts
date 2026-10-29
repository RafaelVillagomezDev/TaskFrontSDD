import { test as base } from '@playwright/test';

import { deleteAccount, registerAccount, requireEnv, uniqueAccount, type Account } from './api-client';

interface AuthFixtures {
  // Usuario de prueba dedicado (E2E_USER_EMAIL), creado por global-setup y reutilizado
  testUser: Account;
  // Cuenta nueva registrada por API para este test y borrada al terminar
  freshAccount: Account;
  // Cuentas que el test crea por la interfaz; se borran al terminar
  accountsToDelete: Account[];
}

export const test = base.extend<AuthFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright exige desestructurar las fixtures aunque no se usen
  testUser: async ({}, provide) => {
    await provide({ email: requireEnv('E2E_USER_EMAIL'), password: requireEnv('E2E_USER_PASSWORD') });
  },
  // eslint-disable-next-line no-empty-pattern -- Playwright exige desestructurar las fixtures aunque no se usen
  freshAccount: async ({}, provide) => {
    const account = uniqueAccount();
    await registerAccount(account);
    await provide(account);
    await deleteAccount(account);
  },
  // eslint-disable-next-line no-empty-pattern -- Playwright exige desestructurar las fixtures aunque no se usen
  accountsToDelete: async ({}, provide) => {
    const accounts: Account[] = [];
    await provide(accounts);
    for (const account of accounts) await deleteAccount(account);
  },
});

export { expect } from '@playwright/test';
