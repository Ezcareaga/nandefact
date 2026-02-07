import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@domain': './src/domain',
      '@application': './src/application',
      '@infrastructure': './src/infrastructure',
      '@interfaces': './src/interfaces',
    },
  },
});
