import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Reglas que hacen cumplir CONSTITUTION.md (principios IV y VI) y AGENTS.md §7 y §8, todas como error
export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
      'blob-report',
      '.playwright-mcp',
      'graphify-out',
      '.claude',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.e2e.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // IV.1: sin any
      '@typescript-eslint/no-explicit-any': 'error',
      // IV.2: sin aserciones de tipo, incluido `as const`
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      // IV.3: sin enum, se usan uniones de literales
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Prohibido enum: usa una unión de literales (CONSTITUTION.md IV.3).',
        },
      ],
      // VI.6: dependencias completas en los efectos
      'react-hooks/exhaustive-deps': 'error',
      // AGENTS.md §7
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-nested-ternary': 'error',
      'max-params': ['error', 4],
      'no-warning-comments': ['error', { terms: ['todo', 'fixme'], location: 'start' }],
    },
  },
  {
    // IV.2, excepción: los tests pueden usar aserciones para tipar mocks, espías y datos de prueba
    files: ['**/tests/**/*.test.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    // Ficheros JavaScript de configuración: sin comprobación de tipos
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { ...tseslint.configs.disableTypeChecked.languageOptions, globals: { ...globals.node } },
  },
);
