import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Permitir prefijo _ para parámetros no usados
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Requerir tipos de retorno explícitos en funciones exportadas
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true },
      ],
      // No permitir any
      '@typescript-eslint/no-explicit-any': 'error',
      // Consistencia con imports de tipo
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.config.js'],
  },
);
