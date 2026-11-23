import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**']),
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
]);
