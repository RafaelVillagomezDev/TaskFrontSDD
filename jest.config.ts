import type { Config } from 'jest';

// Modo ESM como en TaskApiSDD: ts-jest transforma TypeScript y TSX como módulos ES
const config: Config = {
  // jsdom con el fetch de Node (jest/jsdom-fetch.environment.js)
  testEnvironment: '<rootDir>/jest/jsdom-fetch.environment.js',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.app.json' }],
  },
  moduleNameMapper: {
    // Los estilos no se evalúan en los tests
    '\\.css$': 'identity-obj-proxy',
    // import.meta.env no existe en Jest: env.ts se sustituye por un stub (plan R-3)
    '^(\\.{1,2}/)+((shared/)?config/)?env$': '<rootDir>/jest/env.stub.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  // Tests unitarios en las subcarpetas tests/ (AGENTS.md §2); las E2E son de Playwright
  testMatch: ['<rootDir>/src/**/tests/**/*.test.ts?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/e2e/'],
  // Cobertura sobre todo src/, también lo que no tiene test (quality gate de SonarQube), sin los ficheros sin lógica (CONSTITUTION.md IV.4)
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/tests/**',
    '!src/**/*.types.ts',
    '!src/**/*.texts.ts',
    '!src/**/*.constants.ts',
    '!src/main.tsx',
    '!src/shared/config/env.ts',
  ],
  coverageReporters: ['lcov', 'text-summary'],
};

export default config;
