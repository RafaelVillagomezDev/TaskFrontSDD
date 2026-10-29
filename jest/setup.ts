// Matchers de DOM de Testing Library (toBeInTheDocument, toHaveAccessibleName…) en todos los tests
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Ningún test llega a la red: una petición sin simular falla (cada test la simula con mockApi)
beforeEach(() => {
  jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Petición sin simular en el test'));
});
