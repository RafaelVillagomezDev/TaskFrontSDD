// Matchers de DOM de Testing Library (toBeInTheDocument, toHaveAccessibleName…) en todos los tests
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

import { installFakeTurnstile, uninstallFakeTurnstile } from './fake-turnstile';

// Ningún test llega a la red: una petición sin simular falla (cada test la simula con mockApi)
beforeEach(() => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Petición sin simular en el test'));
  // Turnstile que supera la comprobación al pintarse; los tests del widget instalan el suyo (spec 005). Los
  // tests con el entorno node no tienen window
  if (typeof window !== 'undefined') installFakeTurnstile({ autoSolve: true });
});

afterEach(() => {
  if (typeof window !== 'undefined') uninstallFakeTurnstile();
});
