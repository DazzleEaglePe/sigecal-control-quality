import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const TYPESCRIPT_FILES = ['**/*.{ts,tsx}'];

export default defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/node_modules/**',
    'apps/api/src/generated/**',
  ]),
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    files: TYPESCRIPT_FILES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    files: ['packages/shared/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@sigecal/api',
                '@sigecal/api/*',
                '@sigecal/web',
                '@sigecal/web/*',
              ],
              message:
                'El paquete shared no puede depender de ninguna aplicación.',
            },
            {
              group: ['**/apps/api/**', '**/apps/web/**'],
              message: 'El paquete shared no puede importar código de apps.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@sigecal/web', '@sigecal/web/*', '**/apps/web/**'],
              message: 'La API no puede depender de la aplicación web.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@sigecal/api', '@sigecal/api/*', '**/apps/api/**'],
              message:
                'La web consume contratos compartidos, no implementaciones de la API.',
            },
          ],
        },
      ],
    },
  },
);
