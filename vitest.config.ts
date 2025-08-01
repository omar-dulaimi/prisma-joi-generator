import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'lib/',
        'package/',
        'prisma/',
        '*.config.*',
        'tests/',
      ],
    },
  },
});